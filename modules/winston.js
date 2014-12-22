(function(define) {define(function(require) {
    var util        = require('util');
    var winston     = require('winston');
    var levels      = {trace:10, debug:20, info:30, warn:40, error:50, fatal:60};
    var container   = new winston.Container();
    winston.addColors({trace:'cyan', debug:'blue', info:'green', warn:'yellow', error:'magenta', fatal:'red'});

    // options: name, transports, dependencies
    function Winston(options) {
        var log             = null;
        var name            = options.name || 'winston_default_name';
        var transports      = options.transports || {};
        var dependencies    = options.dependencies;
        return {
            init : function() {
                if (dependencies && dependencies.length) {
                    dependencies.forEach(function(element, index, array) {
                        require(element); // try catch maybe
                    });
                }
                log = container.add(name, transports);
                log.setLevels(levels);
                log.addRewriter(function(level, msg, meta) {
                    meta.name = name;
                    return meta;
                });
                function logHandler(level, data) {
                    if (typeof data[0] !== 'string') {
                        try { // stringify if object literal
                            data[0] = JSON.stringify(data[0], null, 2);
                        } catch (e) {// inspect if complex structure
                            data[0] = util.inspect(data[0]);
                        }
                    }
                    log[level].apply(log, data);
                }
                return {
                    trace   :   function() {
                        logHandler('trace', arguments);
                    },
                    debug   :   function() {
                        logHandler('debug', arguments);
                    },
                    info    :   function() {
                        logHandler('info', arguments);
                    },
                    warn    :   function() {
                        logHandler('warn', arguments);
                    },
                    error   :   function() {
                        logHandler('error', arguments);
                    },
                    fatal   :   function() {
                        logHandler('fatal', arguments);
                    }
                };
            }
        };
    }

    return {
        init: function(options) {
            var log = new Winston(options);
            return log.init();
        }
    };

});})(typeof define === 'function' && define.amd ?  define : function(factory) { module.exports = factory(require); });
