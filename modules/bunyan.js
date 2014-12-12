(function(define) {define(function(require){
    
    var bunyan = require('bunyan');

    function fixStreams(streams){
        return streams.map(function(stream){
            if(stream.stream == 'process.stdout') stream.stream = process.stdout;
            if(stream.stream == 'process.stderr') stream.stream = process.stderr;
            return stream;
        });
    }
    
    // args: name, streams
    function Bunyan(args){
        var log = null;
        var streams = fixStreams(args.streams);
        var name = args.name;
        return {
            init   : function(){
                log = bunyan.createLogger({
                    name    :   name        || 'bunyan_default_name',
                    streams :   streams     || []
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
        }
    }

    return {
        init: function(args){
            var log = new Bunyan(args);
            return log.init();
        }
    };

});})(typeof define === 'function' && define.amd ?  define : function(factory){ module.exports = factory(require); });