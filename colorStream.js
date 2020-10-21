const Stream = require('readable-stream').Stream;
const util = require('util');
const format = util.format;
const http = require('http');

const colors = {
    bold: [1, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    white: [37, 39],
    grey: [90, 39],
    black: [30, 39],
    blue: [34, 39],
    cyan: [36, 39],
    green: [32, 39],
    magenta: [35, 39],
    brightMagenta: [95, 39],
    red: [31, 39],
    brightYellow: ['93;1', '39;22'],
    brightCyan: [96, 39],
    brightGreen: [92, 39],
    yellow: [33, 39]
};

const defaultOptions = {
    mode: 'long', // short, long, dev
    useColor: true
};

const levelFromName = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
};

const colorFromLevel = {
    10: 'grey', // TRACE
    20: 'blue', // DEBUG
    30: 'cyan', // INFO
    40: 'magenta', // WARN
    50: 'red', // ERROR
    60: 'inverse' // FATAL
};

const nameFromLevel = {};
const upperNameFromLevel = {};
const upperPaddedNameFromLevel = {};
Object.keys(levelFromName).forEach(function(name) {
    const lvl = levelFromName[name];
    nameFromLevel[lvl] = name;
    upperNameFromLevel[lvl] = name.toUpperCase();
    upperPaddedNameFromLevel[lvl] = (name.length === 4 ? ' ' : '') + name.toUpperCase();
});

function prettyJson(json) {
    return '\x1B[97m' + (JSON.stringify(json) || '').replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function(match) {
        let style = '97';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                style = '32';
            } else {
                style = '36';
            }
        } else if (/true|false/.test(match)) {
            style = '97';
        } else if (/null/.test(match)) {
            style = '95';
        }
        return '\x1B[' + style + 'm' + match + '\x1B[97m\x1B[22m';
    }) + '\x1B[0m';
}

function PrettyStream(opts) {
    const options = {};

    if (opts) {
        Object.keys(opts).forEach(function(key) {
            options[key] = {
                value: opts[key],
                enumerable: true,
                writable: true,
                configurable: true
            };
        });
    }

    const config = Object.create(defaultOptions, options);

    this.readable = true;
    this.writable = true;

    Stream.call(this);

    function stylize(str, color) {
        if (!str) {
            return '';
        }

        if (!config.useColor) {
            return str;
        }

        if (!color) {
            color = 'white';
        }

        const codes = colors[color];
        if (codes) {
            return '\x1B[' + codes[0] + 'm' + str +
                '\x1B[' + codes[1] + 'm';
        }
        return str;
    }

    function indent(s) {
        return '    ' + s.split(/\r?\n/).join('\n    ');
    }

    function extractTime(rec) {
        const time = (typeof rec.time === 'object') ? rec.time.toISOString() : rec.time;

        if ((config.mode === 'short' || config.mode === 'dev') && time[10] === 'T') {
            return stylize(time.substr(11));
        }
        return stylize(time);
    }

    function extractName(rec) {
        let name = rec.name;

        if (rec.component) {
            name += '/' + rec.component;
        }

        if (config.mode !== 'short' && config.mode !== 'dev') {
            name += '/' + rec.pid;
        }

        return name;
    }

    function extractLevel(rec) {
        const level = (upperPaddedNameFromLevel[rec.level] || 'LVL' + rec.level);
        return stylize(level, colorFromLevel[rec.level]);
    }

    function extractSrc(rec) {
        let src = '';
        if (rec.src && rec.src.file) {
            if (rec.src.func) {
                src = format('(%s:%d in %s)', rec.src.file, rec.src.line, rec.src.func);
            } else {
                src = format('(%s:%d)', rec.src.file, rec.src.line);
            }
        }
        return stylize(src, 'green');
    }

    function extractMtid(rec) {
        if (rec.mtid) {
            return ' ' + stylize(rec.mtid, 'brightYellow');
        }
        return '';
    }

    function extractHost(rec) {
        return rec.hostname || '<no-hostname>';
    }

    function isSingleLineMsg(text) {
        return text.indexOf('\n') === -1;
    }

    function extractMsg(text) {
        return stylize(text, 'brightYellow');
    }

    function extractReqDetail(rec) {
        if (rec.req && typeof (rec.req) === 'object') {
            const req = rec.req;
            const headers = req.headers;

            let str = format('%s %s HTTP/%s%s%s',
                req.method,
                req.url,
                req.httpVersion || '1.1',
                (req.remoteAddress ? '\nremote: ' + req.remoteAddress + ':' + req.remotePort : ''),
                (headers ? '\n' + Object.keys(headers).map(function(h) {
                    return h + ': ' + headers[h];
                }).join('\n') : '')
            );

            if (req.body) {
                str += '\n\n' + (typeof (req.body) === 'object' ? JSON.stringify(req.body, null, 2) : req.body);
            }
            if (req.trailers && Object.keys(req.trailers).length > 0) {
                str += '\n' + Object.keys(req.trailers).map(function(t) { return t + ': ' + req.trailers[t]; }).join('\n');
            }

            const skip = ['headers', 'url', 'httpVersion', 'body', 'trailers', 'method', 'remoteAddress', 'remotePort'];

            const extras = {};

            Object.keys(req).forEach(function(k) {
                if (skip.indexOf(k) === -1) {
                    extras['req.' + k] = req[k];
                }
            });

            return {
                details: [str],
                extras: extras
            };
        }
    }

    function genericRes(res) {
        let s = '';

        if (res.statusCode) {
            s += format('HTTP/1.1 %s %s\n', res.statusCode, http.STATUS_CODES[res.statusCode]);
        }

        if (res.header) {
            s += res.header.trimRight();
        } else if (res.headers) {
            const headers = res.headers;
            s += Object.keys(headers).map(
                function(h) {
                    return h + ': ' + headers[h];
                }).join('\n');
        }

        if (res.body) {
            s += '\n\n' + (typeof (res.body) === 'object' ? JSON.stringify(res.body, null, 2) : res.body);
        }
        if (res.trailer) {
            s += '\n' + res.trailer;
        }

        const skip = ['header', 'statusCode', 'headers', 'body', 'trailer'];

        const extras = {};

        Object.keys(res).forEach(function(k) {
            if (skip.indexOf(k) === -1) {
                extras['res.' + k] = res[k];
            }
        });

        return {
            details: [s],
            extras: extras
        };
    }

    function extractResDetail(rec) {
        if (rec.res && typeof (rec.res) === 'object') {
            return genericRes(rec.res);
        }
    }

    function extractClientReqDetail(rec) {
        if (rec.clientReq && typeof (rec.clientReq) === 'object') {
            const clientReq = rec.clientReq;

            const headers = clientReq.headers;
            let hostHeaderLine = '';
            let s = '';

            if (clientReq.address) {
                hostHeaderLine = 'Host: ' + clientReq.address;

                if (clientReq.port) {
                    hostHeaderLine += ':' + clientReq.port;
                }

                hostHeaderLine += '\n';
            }

            s += format('%s %s HTTP/%s\n%s%s', clientReq.method,
                clientReq.url,
                clientReq.httpVersion || '1.1',
                hostHeaderLine,
                (headers ? Object.keys(headers).map(
                    function(h) {
                        return h + ': ' + headers[h];
                    }).join('\n') : ''));

            if (clientReq.body) {
                s += '\n\n' + (typeof (clientReq.body) === 'object' ? JSON.stringify(clientReq.body, null, 2) : clientReq.body);
            }

            const skip = ['headers', 'url', 'httpVersion', 'body', 'trailers', 'method', 'remoteAddress', 'remotePort'];

            const extras = {};

            Object.keys(clientReq).forEach(function(k) {
                if (skip.indexOf(k) === -1) {
                    extras['client_req.' + k] = clientReq[k];
                }
            });

            return {
                details: [s],
                extras: extras
            };
        }
    }

    function extractClientResDetail(rec) {
        if (rec.clientRes && typeof (rec.clientRes) === 'object') {
            return genericRes(rec.clientRes);
        }
    }

    function extractError(rec) {
        let result;
        let error = rec.error;
        let count = 5;
        while (error && count--) {
            if (error.fileName) {
                result = result || [];
                result.push('(' + error.fileName + ')');
            }
            if (error.method) {
                result = result || [];
                result.push(error.method + ' => ');
            }
            if (error.stack) {
                result = result || [];
                if (error.remoteStack) {
                    result.push('-- remote stack --');
                    result.push.apply(result, ((error.remoteStack instanceof Array) ? error.remoteStack : [error.remoteStack]));
                } else {
                    result.push.apply(result, ((error.stack instanceof Array) ? error.stack : [error.stack]));
                }
            }
            error = error.cause;
            count && error && error.stack && result.push('-- error cause --');
        }
        return result;
    }

    function extractCustomDetails(rec) {
        const skip = ['name', 'hostname', 'pid', 'level', 'component', 'msg', 'time', 'v', 'src', 'error', 'clientReq',
            'clientRes', 'req', 'res', '$meta', 'mtid', 'jsException', 'service', 'impl', 'env', 'location'];

        const sortedDetails = ['context', 'trace'];
        const sortFn = function(a, b) {
            const ia = sortedDetails.indexOf(a);
            const ib = sortedDetails.indexOf(b);
            let r;
            if (ia < 0 && ib < 0) {
                if (a < b) {
                    r = -1;
                } else if (a > b) {
                    r = 1;
                } else {
                    r = 0;
                }
            } else if (ia < 0) {
                r = 1;
            } else if (ib < 0) {
                r = -1;
            } else {
                r = ia - ib;
            }
            return r;
        };

        const details = [];
        const extras = {};

        Object.keys(rec).sort(sortFn).forEach(function(key) {
            if (skip.indexOf(key) === -1) {
                let value = rec[key];
                let stringified = false;
                if (typeof value === 'undefined' || typeof value === 'function') {
                    value = '';
                } else if (typeof value === 'symbol') {
                    value = value.toString();
                } else if (typeof value !== 'string') {
                    value = prettyJson(value);
                    stringified = true;
                } else {
                    if (value.length > 130 && value.match(/[0-9a-fA-F]+/)) {
                        value = value.substr(0, 128) + '..';
                    }
                }
                if (value.indexOf('\n') !== -1 || value.length > 130) {
                    details.push('\n' + stylize(key, 'green') + ': ' + value);
                } else if (!stringified && (value.indexOf(' ') !== -1 || value.length === 0)) {
                    extras[key] = prettyJson(value);
                } else {
                    extras[key] = value;
                }
            }
        });

        return {
            details: details,
            extras: extras
        };
    }

    function applyDetails(results, details, extras) {
        if (results) {
            results.details.forEach(function(d) {
                details.push(indent(d));
            });
            Object.keys(results.extras).forEach(function(k) {
                extras.push(stylize(k, 'green') + '=' + results.extras[k]);
            });
        }
    }

    this.formatRecord = function formatRecord(rec) {
        let details = [];
        let extras = [];

        const time = extractTime(rec);
        const level = extractLevel(rec);
        const service = stylize(rec.service || '*', 'yellow');
        const name = extractName(rec);
        const host = extractHost(rec);
        const src = extractSrc(rec);
        const mtid = extractMtid(rec);
        const text = (rec.$meta && (rec.$meta.method || rec.$meta.opcode)) || rec.msg;
        const msg = isSingleLineMsg(text) ? extractMsg(text) : '';
        if (!msg) {
            details.push(indent(extractMsg(text)));
        }

        const error = extractError(rec);
        if (error) {
            details.push(stylize(error.join('\n    \x1B[31m'), 'red'));
        }

        if (rec.req) {
            applyDetails(extractReqDetail(rec), details, extras);
        }
        if (rec.res) {
            applyDetails(extractResDetail(rec), details, extras);
        }
        if (rec.clientReq) {
            applyDetails(extractClientReqDetail(rec), details, extras);
        }
        if (rec.clientRes) {
            applyDetails(extractClientResDetail(rec), details, extras);
        }

        applyDetails(extractCustomDetails(rec), details, extras);

        extras = (extras.length ? ' (' + extras.join(', ') + ')' : '');
        details = (details.length ? details.join('\n    --\n') : '');

        if (config.mode === 'long') {
            return format('[%s] %s: %s %s on %s%s:%s %s%s\n%s',
                time,
                level,
                service,
                name,
                host,
                src,
                mtid,
                msg,
                extras,
                details);
        }
        if (config.mode === 'short') {
            return format('[%s] %s %s %s:%s %s%s\n%s',
                time,
                level,
                service,
                name,
                mtid,
                msg,
                extras,
                details);
        }
        if (config.mode === 'dev') {
            return format('%s %s %s %s %s:%s %s%s %s\n',
                time,
                level,
                service,
                name,
                src,
                mtid,
                msg,
                extras,
                details);
        }
    };
}

util.inherits(PrettyStream, Stream);

PrettyStream.prototype.write = function write(data) {
    if (typeof data === 'string') {
        this.emit('data', this.formatRecord(JSON.parse(data)));
    } else if (typeof data === 'object') {
        this.emit('data', this.formatRecord(data));
    }
    return true;
};

PrettyStream.prototype.end = function end() {
    this.emit('end');
    return true;
};

module.exports = function(config) {
    return new PrettyStream(config);
};
