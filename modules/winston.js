(function(define) {define(function(require) {
    var util = require('util');
    var winston = require('winston');
    var levels = {trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60};
    var container = new winston.Container();
    winston.addColors({trace: 'cyan', debug: 'blue', info: 'green', warn: 'yellow', error: 'magenta', fatal: 'red'});

    // options: name, transports, dependencies
    function Winston(options) {
        var lib = options.lib;
        var transports = {};
        if(options.transports) {
            transports = options.transports;
        }
        else if(options.streams && options.streams.length) { // bunyan-like streams
            transports.transports = [];
            var type;
            options.streams.forEach(function(stream){
                if((type = lib.capitalize(stream.type)) == 'Raw') {
                    type = 'File';
                }
                if (!winston.transports[type]) {
                    throw new Error('Cannot add unknown transport: ' + type);
                }
                delete stream.type;
                stream.name = '' + type + '_' + Math.random().toString(36).substring(12);
                transports.transports.push(new (winston.transports[type])(stream))
            });
        }
        var dependencies = options.dependencies;
        if (dependencies && dependencies.length) {
            dependencies.forEach(function(element, index, array) {
                require(element); // try catch maybe
            });
        }

        return function createLogger(params) {
            var log = container.add(params.name || options.name, transports);
            log.setLevels(levels);
            log.addRewriter(function(level, msg, meta) {
                meta.name = params.name || options.name;
                meta.context = params.context || options.context;
                return meta;
            });
            function logHandler(level, data) {
                if (typeof data[0] !== 'string') {
                    lib.transformData(data);
                    try { // stringify if object literal
                        data[0] = JSON.stringify(data[0], null, 2);
                    } catch (e) {// inspect if complex structure
                        data[0] = util.inspect(data[0]);
                    }
                }
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
            };
        }
    }

    return Winston;

});})(typeof define === 'function' && define.amd ? define : function(factory) {module.exports = factory(require);});
