var _ = {
    defaultsDeep: require('lodash.defaultsdeep'),
    cloneDeepWith: require('lodash.clonedeepwith')
};
var MAX_ERROR_CAUSE_DEPTH = 5;
/**
 * @module ut-log
 * @author UT Route Team
 * @description Logging module
 */
// helper methods
var lib = {
    extractErrorData: function(err) {
        return {
            error: getErrorTree(err, new Set()),
            $meta: {
                opcode: err.type || err.opcode || 'error'
            },
            jsException: err
        };
        function getErrorTree(error, visited) {
            if (!error || visited.size >= MAX_ERROR_CAUSE_DEPTH) {
                return;
            }
            var cause = error.cause;
            if (visited.has(error)) {
                cause = undefined; // make this step last
            }
            visited.add(error);
            if (visited.has(cause)) {
                error.cause = undefined; // break circular refs
            }
            return {
                type: error.type,
                opcode: error.opcode,
                code: error.code,
                print: error.print,
                stack: error.stack && error.stack.split('\n'),
                remoteStack: error.stackInfo,
                cause: cause && getErrorTree(cause, visited)
            };
        }
    },
    capitalize: function(str) {
        return (str && str[0].toUpperCase() + str.slice(1)) || null;
    },
    transformData: function transformData(data, options) {
        if (!data || data[0] == null || typeof data[0] !== 'object') {
            return;
        }
        var context = {};
        if (data[0].$meta) {
            if (data[0].$meta.mtid != null) {
                context.mtid = data[0].$meta.mtid;
            }
            if (data[0].$meta.trace != null) {
                context.trace = data[0].$meta.trace;
            }
        }
        var message;
        if (data[0].message && data[0].message.constructor.name === 'Buffer') {
            message = data[0].message.toString('hex', 0, Math.min(data[0].message.length, 1024)).toUpperCase();
        }
        data[0] = _.cloneDeepWith(_.defaultsDeep(data[0], context), function(value, key) {
            if (typeof key === 'string') {
                if ((options && options[key] === 'hide') || (/password|(^otp$)|(^pass$)|(^token$)|(\.routeConfig$)/i).test(key)) {
                    return '*****';
                } else if ((/accountNumber|customerNumber|customerNo|documentId/i).test(key)) {
                    return '*****' + ((typeof value === 'string') ? value.slice(-4) : '');
                } else if (key === 'cookie' || key === 'utSessionId') {
                    return '*****' + ((typeof value === 'string') ? value.slice(-4) : '');
                } else if ((['url', 'uri', 'href', 'path', 'search', 'query'].indexOf(key) > -1) && typeof value === 'string' && (/password|(^pass$)|(^token$)/i).test(value)) {
                    var trimTo = value.indexOf('?') > -1 ? value.indexOf('?') : 4;
                    return value.substring(0, trimTo) + '*****';
                }
            }
        });
        if (message && 'message' in data[0]) {
            data[0].message = message;
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
    if (options.type === 'winston') {
        this.init(require('./modules/winston')(options));
    } else { // require bunyan by default
        this.init(require('./modules/bunyan')(options));
    }
}

Logger.prototype.init = function LoggerInit(logger) {
    this.logger = logger;
};

Logger.prototype.createLog = function createLog(level, params, config) {
    var levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    var log = this.logger ? this.logger(params, config) : null;
    if (!log) {
        return {};
    }
    return levels
        .slice(levels.indexOf(level), levels.length)
        .reduce(function(levels, level) {
            levels[level] = log[level].bind(log);
            return levels;
        }, {});
};

module.exports = Logger;
