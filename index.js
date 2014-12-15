(function(define){define(function(require){

    /**
     * @module ut-log
     * @author UT Route Team
     * @description Logging module
     */
    /**
     * @class Logger
     *
     * @tutorial wire
     * @tutorial bunyan
     * @tutorial winston
     * 
     * @param {object} options logger options.
     * 
     * @param {string} [options.type=winston]  The type of the logger - currently supported are 'winston' and 'bunyan'
     * 
     * @param {string} [options.name=type_default_name]  The name of the logger
     * 
     * @param {array} options.dependencies <b style="color: red">WINSTON ONLY!</b>
     * An array of strings representing the names of the modules that Winston depends on
     * 
     * @param {object} options.transports  <b style="color: red">WINSTON ONLY!</b> An object of Winston transports.
     * For more info: [Winston transports]{@link https://github.com/flatiron/winston/blob/master/docs/transports.md}
     * 
     * @param {array} options.streams <b style="color: red">BUNYAN ONLY!</b> An array of Bunyan streams
     * For more info: [Bunyan streams]{@link https://github.com/trentm/node-bunyan#user-content-streams} 
     */
    function Logger(options){
        this.init(require('./modules/' + (options.type || 'winston')).init(options));
    }

    Logger.prototype.init = function Logger__init(logger){
        /**
         * @method trace
         * @description logLevel = 10
         * @param {string} message Message to be logged
         */
        this.trace  =   logger.trace;
        /**
         * @method debug
         * @description logLevel = 20
         * @param {string} message Message to be logged
         */
        this.debug  =   logger.debug;
        /**
         * @method info
         * @description logLevel = 30
         * @param {string} message Message to be logged
         */
        this.info   =   logger.info;
        /**
         * @method warn
         * @description logLevel = 40
         * @param {string} message Message to be logged
         */
        this.warn   =   logger.warn;
        /**
         * @method error
         * @description logLevel = 50
         * @param {string} message Message to be logged
         */
        this.error  =   logger.error;
        /**
         * @method fatal
         * @description logLevel = 60
         * @param {string} message Message to be logged
         */
        this.fatal  =   logger.fatal;
        /**
         * @method initLevels
         * @param {string} level minimum logging level
         * @returns {object} An object with the allowed logging levels
         */
        this.initLevels = function(level){
            var     levels = ['trace', 'debug', 'info','warn','error','fatal'];
            return  levels
                    .slice(levels.indexOf(level),levels.length)
                    .reduce(function(levels,level){
                        levels[level]=true;
                        return levels;
                    },{});
        };
    };

    return Logger;

});})(typeof define === 'function' && define.amd ?  define : function(factory){ module.exports = factory(require); });