(function(define) {define(function(require) {
    var winston = require('winston');
    winston.addColors({trace:'cyan', debug:'blue', info:'green', warn:'yellow', error:'magenta', fatal:'red'});

    // options: name, transports, dependencies
    function Winston(options) {
        var container       = null;
        var log             = null;
        var name            = options.name;
        var transports      = options.transports;
        var dependencies    = options.dependencies;
        return {
            init : function() {
                if (dependencies && dependencies.length) {
                    dependencies.forEach(function(element, index, array) {
                        require(element);
                    });
                }
                container   =   new winston.Container();
                log         =   container.add(name || 'winston_default_name', transports || {});
                log.setLevels({trace:10, debug:20, info:30, warn:40, error:50, fatal:60});
                return {
                    trace   :   log.trace.bind(log),
                    debug   :   log.debug.bind(log),
                    info    :   log.info.bind(log),
                    warn    :   log.warn.bind(log),
                    error   :   log.error.bind(log),
                    fatal   :   log.fatal.bind(log)
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
