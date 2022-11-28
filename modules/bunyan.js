const bunyan = require('bunyan');

function fixStreams(streams, workDir, loggerOptions) {
    if (!streams || !streams.length) {
        return [];
    }
    return streams.reduce(function(prev, stream) {
        let createStream;
        if (!stream || stream === 'false') return prev;
        const result = Object.assign({}, stream);
        if (stream.stream === 'process.stdout') {
            if (stream.streamConfig) {
                if (process.browser) {
                    result.stream = require('../consoleStream')(stream.streamConfig);
                } else {
                    createStream = require('./serverRequire')('../colorStream');
                    result.stream = createStream(stream.streamConfig);
                    result.stream.pipe(process.stdout);
                }
                delete result.streamConfig;
            } else {
                result.stream = process.stdout;
            }
        } else if (stream.stream === 'process.stderr') {
            if (stream.streamConfig) {
                createStream = require('./serverRequire')('../colorStream');
                result.stream = createStream(stream.streamConfig);
                result.stream.pipe(process.stderr);
                delete result.streamConfig;
            } else {
                result.stream = process.stdout;
            }
        } else if (typeof stream.stream === 'string') {
            createStream = require('./serverRequire')(stream.stream);
            result.streamConfig.workDir = workDir;
            result.stream = createStream(stream.streamConfig, loggerOptions);
            delete result.streamConfig;
        } else if (typeof stream.stream === 'function') {
            createStream = stream.stream;
            result.stream = null;
            result.streamConfig.workDir = workDir;
            result.stream = createStream(stream.streamConfig, loggerOptions);
            delete result.streamConfig;
        }
        result.stream && prev.push(result);
        return prev;
    }, []);
}
// options: name, streams
function Bunyan(options) {
    const lib = options.lib;
    const streams = fixStreams(options.streams, options.workDir, options);
    let streamsDestroyed = false;
    const result = function createLogger(params, config) {
        params.streams = streams;
        params.level = options.level || 'trace';
        params.name = params.name || options.name;
        params.service = options.service;
        params.impl = options.impl;
        params.env = options.env;
        params.location = options.location;
        if (typeof window === 'undefined' && !params.location) {
            params.location = require('os').hostname();
        }
        Object.assign(params, options.udf);
        const log = bunyan.createLogger(params);
        log.on('error', () => {}); // @TODO: handle error correctly.

        function logHandler(level, data) {
            const logData = [];
            if (data.length === 1) {
                if (data[0] instanceof Error) {
                    logData.push(lib.extractErrorData(data[0]), config);
                    logData.push(data[0].message);
                } else {
                    logData.push(data[0]);
                }
            } else if (data.length > 1) {
                logData.push(data[1]);
                logData.push(data[0]);
            }
            lib.transformData(logData, config);
            if ((level === 'error' || level === 'fatal') && !(data[0] instanceof Error)) {
                const err = new Error();
                log.warn({
                    logMessage: lib.maskData(data[0], {}, config),
                    stack: err.stack.split('\n').splice(3).join('\n')
                }, 'A js exception must be logged for the levels \'error\' and \'fatal\'');
            }
            if (streamsDestroyed) {
                // eslint-disable-next-line no-console
                console.error('Error logging', JSON.stringify(logData));
                throw new Error('Trying to log through a destroyed logger ' + params.name);
            }
            log[level].apply(log, logData);
        }

        return {
            trace: function() {
                logHandler('trace', arguments);
            },
            debug: function() {
                logHandler('debug', arguments);
            },
            info: function() {
                logHandler('info', arguments);
            },
            warn: function() {
                logHandler('warn', arguments);
            },
            error: function(e) {
                logHandler(e?.fatal ? 'fatal' : 'error', arguments);
            },
            fatal: function() {
                logHandler('fatal', arguments);
            }
        };
    };
    result.destroy = function() {
        streamsDestroyed = true;
        streams.forEach(stream => {
            if (stream.stream &&
                typeof stream.stream.end === 'function' &&
                ![process.stdout, process.stdin, process.stderr].includes(stream.stream)
            ) {
                let destroyed = false;
                const destroyTimeout = setTimeout(() => {
                    if (!destroyed) {
                        destroyed = true;
                        typeof stream.stream.destroy === 'function' && stream.stream.destroy();
                    }
                }, 5000);
                stream.stream.end(() => {
                    if (!destroyed) {
                        destroyed = true;
                        clearTimeout(destroyTimeout);
                        typeof stream.stream.destroy === 'function' && stream.stream.destroy();
                    }
                });
            }
        });
    };

    return result;
}

module.exports = Bunyan;
