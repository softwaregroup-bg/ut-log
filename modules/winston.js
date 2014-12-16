(function(define) {define(function(require) {
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
