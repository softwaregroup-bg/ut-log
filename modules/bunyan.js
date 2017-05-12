var bunyan = require('bunyan');
var serverRequire = require;
var path = require('path');
function fixStreams(streams, workDir) {
    if (!streams || !streams.length) {
        return [];
    }
    return streams.reduce(function(prev, stream) {
        var createStream = function(writableFactory, readable) {
            var writable;
            var transform;
            if (writableFactory) {
                writable = writableFactory(stream.streamConfig);
            }
            if (stream.transform) {
                transform = require(path.join(process.cwd(), stream.transform))(stream.streamConfig);
            }
            if (writable) {
                stream.stream = writable;
            }
            if (transform) {
                if (writable) {
                    stream.stream.pipe(transform);
                } else {
                    stream.stream = transform;
                }
            }
            if (readable) {
                if (writable || transform) {
                    stream.stream.pipe(readable);
                } else {
                    stream.stream = readable;
                }
            }
            delete stream.streamConfig;
        }
        if (stream.stream === 'process.stdout') {
            if (stream.streamConfig) {
                createStream(serverRequire('../colorStream'), process.stdout);
            } else {
                createStream(null, process.stdout);
            }
        } else if (stream.stream === 'process.stderr') {
            if (stream.streamConfig) {
                createStream(serverRequire('../colorStream'), process.stderr);
            } else {
                createStream(null, process.stderr);
            }
        } else if (typeof stream.stream === 'string') {
            stream.streamConfig.workDir = workDir;
            createStream(serverRequire(stream.stream), null);
        } else if (typeof stream.stream === 'function') {
            stream.streamConfig.workDir = workDir;
            createStream(stream.stream, null);
        }
        stream.stream && prev.push(stream);
        return prev;
    }, []);
}
// options: name, streams
function Bunyan(options) {
    var lib = options.lib;
    var streams = fixStreams(options.streams, options.workDir);
    return function createLogger(params, config) {
        params.streams = streams;
        params.level = options.level || 'trace';
        params.name = params.name || options.name;
        var log = bunyan.createLogger(params);

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
            lib.transformData(logData, config && config.transform);
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
