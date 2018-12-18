var bunyan = require('bunyan');
var serverRequire = require;

function fixStreams(streams, workDir, loggerOptions) {
    if (!streams || !streams.length) {
        return [];
    }
    return streams.reduce(function(prev, stream) {
        var createStream;
        if (!stream || stream === 'false') return prev;
        var result = Object.assign({}, stream);
        if (stream.stream === 'process.stdout') {
            if (stream.streamConfig) {
                if (typeof window !== 'undefined') {
                    result.stream = require('../consoleStream')(stream.streamConfig);
                } else {
                    createStream = serverRequire('../colorStream');
                    result.stream = createStream(stream.streamConfig);
                    result.stream.pipe(process.stdout);
                }
                delete result.streamConfig;
            } else {
                result.stream = process.stdout;
            }
        } else if (stream.stream === 'process.stderr') {
            if (stream.streamConfig) {
                createStream = serverRequire('../colorStream');
                result.stream = createStream(stream.streamConfig);
                result.stream.pipe(process.stderr);
                delete result.streamConfig;
            } else {
                result.stream = process.stdout;
            }
        } else if (typeof stream.stream === 'string') {
            createStream = serverRequire(stream.stream);
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
    var lib = options.lib;
    var streams = fixStreams(options.streams, options.workDir, options);
    return function createLogger(params, config) {
        params.streams = streams;
        params.level = options.level || 'trace';
        params.name = params.name || options.name;
        params.service = options.service;
        var log = bunyan.createLogger(params);
        log.on('error', () => {}); // @TODO: handle error correctly.

        function logHandler(level, data) {
            var logData = [];
            if (data.length === 1) {
                if (data[0] instanceof Error) {
                    logData.push(lib.extractErrorData(data[0]));
                    logData.push(data[0].message);
                } else {
                    logData.push(data[0]);
                    data[0] && data[0].$meta && (data[0].$meta.method || data[0].$meta.opcode) && logData.push(data[0].$meta.method || data[0].$meta.opcode);
                }
            } else if (data.length > 1) {
                logData.push(data[1]);
                logData.push(data[0]);
            }
            lib.transformData(logData);
            if ((level === 'error' || level === 'fatal') && !(data[0] instanceof Error)) {
                var err = new Error();
                log.warn({
                    logMessage: lib.maskData(data[0], {}),
                    stack: err.stack.split('\n').splice(3).join('\n')
                }, `A js exception must be logged for the levels 'error' and 'fatal'`);
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
            error: function() {
                logHandler('error', arguments);
            },
            fatal: function() {
                logHandler('fatal', arguments);
            }
        };
    };
}

module.exports = Bunyan;
