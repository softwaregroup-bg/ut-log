(function(define) {define(function(require){

    /**
     * @module ut-log
     * @author UT Route Team
     * @description Logging module
     */   
    var log = null;
    /**
     *
     * 
     * @class Logger
     *
     * @tutorial wire
     * @tutorial bunyan
     * @tutorial winston
     * 
     *
     * @param {object} args logger settings.
     * 
     * @param {string} [args.type=winston]  The type of the logger - currently supported are 'winston' and 'bunyan'
     * 
     * @param {string} [args.name=type_default_name]  The name of the logger
     * 
     * @param {array} args.dependencies <b style="color: red">WINSTON ONLY!</b>
     * An array of strings representing the names of the modules that Winston depends on
     * 
     * @param {object} args.transports  <b style="color: red">WINSTON ONLY!</b> An object of Winston transports.
     * For more info: [Winston transports]{@link https://github.com/flatiron/winston/blob/master/docs/transports.md}
     * 
     * @param {array} args.streams <b style="color: red">BUNYAN ONLY!</b> An array of Bunyan streams
     * For more info: [Bunyan streams]{@link https://github.com/trentm/node-bunyan#user-content-streams} 
     */
    function Logger(args){
        log = require('./modules/' + (args.type || 'winston')).init(args);
        this.init();
    }

    /**
     * @constructs Logger
     */
    Logger.prototype.init = function Logger_init(){

        /**
         * @method trace
         * @description logLevel = 10
         * @param {string} message Message to be logged
         */
        this.trace  =   log.trace;
        /**
         * @method debug
         * @description logLevel = 20
         * @param {string} message Message to be logged
         */
        this.debug  =   log.debug;
        /**
         * @method info
         * @description logLevel = 30
         * @param {string} message Message to be logged
         */
        this.info   =   log.info;
        /**
         * @method warn
         * @description logLevel = 40
         * @param {string} message Message to be logged
         */
        this.warn   =   log.warn;
        /**
         * @method error
         * @description logLevel = 50
         * @param {string} message Message to be logged
         */
        this.error  =   log.error;
        /**
         * @method fatal
         * @description logLevel = 60
         * @param {string} message Message to be logged
         */
        this.fatal  =   log.fatal;

        /**
         * @method initLevel
         * @description logLevel = 60
         * @param {string} level minimum logging level
         * @returns {object} An object with the allowed logging levels
         */
        this.initLevel = function(level){
            var ar = ['trace', 'debug', 'info','warn','error','fatal'];
            return ar.slice(ar.indexOf(level),ar.length).reduce(function(a,b){a[b]=true;return a},{});
        }
    }

    return Logger;

});})(typeof define === 'function' && define.amd ?  define : function(factory){ module.exports = factory(require); });