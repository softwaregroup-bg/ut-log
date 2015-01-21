(function(define) {define(function(require) {
    var bunyan = require('bunyan');

    function fixStreams(streams) {
        if (!streams || !streams.length) {
            return [];
        }
        return streams.map(function(stream) {
            if (stream.stream == 'process.stdout') {stream.stream = process.stdout;}
            if (stream.stream == 'process.stderr') {stream.stream = process.stderr;}
            return stream;
        });
    }
    // options: name, streams
    function Bunyan(options) {
        var lib = options.lib;
        var streams = fixStreams(options.streams);
        return function createLogger(params) {
            params.streams = streams;
            params.level = options.level || 'trace';
            params.name = params.name || options.name;
            var log = bunyan.createLogger(params);

            function logHandler(level, data) {
                if (data.length === 1) {
                    data[0] = {message:data[0]};
                }
                if (data.length >= 2) {
                    var x = data[0];
                    data[0] = data[1];
                    data[1] = x;
                }
                lib.transformData(data);
                log[level].apply(log, data);
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
            }
        }
    }

    return Bunyan;

});})(typeof define === 'function' && define.amd ?  define : function(factory) {module.exports = factory(require);});
