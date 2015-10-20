/**
 * @module ut-log
 * @author UT Route Team
 * @description Logging module
 */
// helper methods
var lib = {
    extractErrorData: function(err){
        return {
            error: {
                code: err.code,
                message: err.message,
                stack: err.stack
            },
            message: 'JS Error: ' + err.message,
            jsException: err
        };
    },
    capitalize: function(str){
        return (str && str[0].toUpperCase() + str.slice(1)) || null;
    },
    transformData : function transformData(data) {
        var _1; var buf;
        if (data && (_1 = data[0]) && (buf = _1.message)  && (buf.constructor.name === 'Buffer')) {
            _1.message = buf.toString('hex', 0, (buf.length > 1024) ? 1024 : buf.length).toUpperCase();
        }
    }
};
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
 **/
function Logger(options) {
    options.lib = lib;
    this.init(require('./modules/' + (options.type || 'winston'))(options));
}

Logger.prototype.init = function LoggerInit(logger) {
    this.logger = logger;
};

Logger.prototype.createLog = function createLog(level, params) {
    var levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    var log = this.logger ? this.logger(params) : null;
    if (!log) {return {}}
    return levels
            .slice(levels.indexOf(level), levels.length)
            .reduce(function(levels, level) {
                levels[level] = log[level].bind(log);
                return levels;
            }, {});
};

module.exports = Logger;
