const table = require('ut-function.console-table');

const _ = {
    defaultsDeep: require('lodash.defaultsdeep'),
    cloneDeepWith: require('lodash.clonedeepwith')
};
/* eslint no-useless-escape: 0 */
const HIDE_DATA = [
    'password',
    '^otp$',
    '^pass$',
    '^token$',
    '\.routeConfig$',
    'track2',
    '^encryptionPass$',
    '^ut5-cookie$',
    '^xsrf$',
    '^xsrfToken$',
    '^x-xsrf-token$',
    '^salt$',
    '^hashParams$',
    '^sessionId$',
    '^jwt$',
    '^apiKey$',
    'cbc',
    'hmac'
];
const MASK_DATA = [
    'accountNumber',
    'customerNumber',
    'customerNo',
    'documentId',
    'cookie',
    'utSessionId'
];
const MAX_ERROR_CAUSE_DEPTH = 5;
/**
 * @module ut-log
 * @author UT Route Team
 * @description Logging module
 */

// helper methods
const LibFactory = function({
    transformData = {},
    maxFieldLength = 0,
    maxArrayLength = 0,
    maxBufferLength = 1024
} = {}) {
    const obfuscate = {hide: [], mask: []};
    Object.entries(transformData).forEach(([key, transform]) => obfuscate[transform] && obfuscate[transform].push('^' + key + '$'));

    const hideRegex = new RegExp(HIDE_DATA.concat(obfuscate.hide).join('|'), 'i');
    const maskRegex = new RegExp(MASK_DATA.concat(obfuscate.mask).join('|'), 'i');

    return {
        extractErrorData: function(err, options) {
            const e = new Error();
            e.name = err.name;
            for (const key of Object.getOwnPropertyNames(err)) {
                Object.assign(e, this.maskData({[key]: err[key]}, {}, options));
            }
            return {
                error: getErrorTree(e, new Set()),
                $meta: {
                    opcode: e.type || e.opcode || e.name || 'error',
                    mtid: 'error'
                },
                jsException: e
            };
            function getErrorTree(error, visited) {
                if (!error || visited.size >= MAX_ERROR_CAUSE_DEPTH) {
                    return;
                }
                let cause = error.cause;
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
                    method: error.method,
                    code: error.code,
                    print: error.print,
                    fileName: error.fileName,
                    req: error.req,
                    res: error.res,
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
            const context = {};
            if (data[0].$meta) {
                if (data[0].$meta.mtid != null) {
                    context.mtid = data[0].$meta.mtid;
                }
                if (data[0].$meta.trace != null) {
                    context.trace = data[0].$meta.trace;
                }
            }
            let message;
            if (data[0].message && data[0].message.constructor.name === 'Buffer') {
                message = data[0].message.toString('hex', 0, Math.min(data[0].message.length, maxBufferLength)).toUpperCase();
            }
            data[0] = this.maskData(data[0], context, options);
            if (message && 'message' in data[0]) {
                data[0].message = message;
            }
        },
        maskData: function(data, context, {transform = {}} = {}) {
            const maskedKeys = [];
            const masked = _.cloneDeepWith(_.defaultsDeep(data, context), function(value, key) {
                if (typeof key === 'string') {
                    if (key === '$meta' && value) {
                        return {
                            ...value.mtid && {mtid: value.mtid},
                            ...value.opcode && {opcode: value.opcode},
                            ...value.method && {method: value.method},
                            ...value.trace && {trace: value.trace},
                            ...value.contId && {contId: value.contId}
                        };
                    } else if (hideRegex.test(key) || transform[key] === 'hide') {
                        maskedKeys.push(key);
                        return '*****';
                    } else if (maskRegex.test(key) || transform[key] === 'mask') {
                        maskedKeys.push(key);
                        return '*****' + ((typeof value === 'string') ? value.slice(-4) : '');
                    } else if ((['url', 'uri', 'href', 'path', 'search', 'query'].indexOf(key) > -1) && typeof value === 'string' && (/password|(^pass$)|(^token$)/i).test(value)) {
                        maskedKeys.push(key);
                        const trimTo = value.indexOf('?') > -1 ? value.indexOf('?') : 4;
                        return value.substring(0, trimTo) + '*****';
                    }
                }
                if (value && value.length) {
                    if (maxFieldLength && value.length > maxFieldLength) {
                        if (typeof value === 'string') return value.slice(0, maxFieldLength).concat('...');
                        if (Buffer.isBuffer(value)) return Buffer.concat([value.slice(0, maxFieldLength), Buffer.from('deadbeef', 'hex')]);
                    }
                    if (maxArrayLength && Array.isArray(value) && value.length > maxArrayLength) return value.slice(0, maxArrayLength).concat('...');
                }
            });
            if (maskedKeys.length > 0 && !masked.maskedKeys) {
                masked.maskedKeys = maskedKeys;
            }
            return masked;
        }
    };
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
    options.lib = LibFactory(options);
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
    const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const log = this.logger ? this.logger(params, config) : null;

    if (!log) {
        return {};
    }
    return levels
        .slice(levels.indexOf(level), levels.length)
        .reduce(function(levels, level) {
            levels[level] = log[level].bind(log);
            return levels;
        }, {table});
};

Logger.prototype.destroy = function() {
    this.logger.destroy();
};

module.exports = Logger;
