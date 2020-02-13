const stream = require('readable-stream');
const util = require('util');
const logRotateStream = require('stream-file-archive');
const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const todayAsDateInit = () => {
    let current;
    let lastUpdated = Date.now() - 1;

    return () => {
        if (lastUpdated < Date.now()) {
            const d = new Date();
            current = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()].join('-');
            lastUpdated = Date.now() + 600000;
        }
        return current;
    };
};
const todayAsDate = todayAsDateInit();

const hexMap = Buffer.from('0123456789ABCDEF');
const asciiMap = Buffer.from(Array(256).fill(0).map((v, i) => ((i < 32) ? 32 : i)));

function bufferLog(buffer, width = 32, separator = '|'.charCodeAt(0)) {
    const nextAscii = 3 * width + 3;
    const nextHex = width + 3;
    const length = buffer.length;
    const lineCount = Math.floor((length - 1) / width) + 1;
    const result = Buffer.alloc(lineCount * (width * 4 + 3), ' ');
    let ascii = -1;
    let hex = -width - 3;
    for (let i = 0; i < length; i += 1) {
        if (i % width === 0) {
            if (ascii > 0) {
                result[ascii] = 10;
            }
            hex = hex + nextHex;
            ascii = ascii + nextAscii;
            result[ascii - 2] = separator;
        }
        const v = buffer[i];
        result[ascii] = asciiMap[v];
        result[hex] = hexMap[v >> 4];
        result[hex + 1] = hexMap[v & 15];
        hex++;
        hex++;
        hex++;
        ascii++;
    }
    return result;
}

// config : file, size, keep, compress
// refer to: https://www.npmjs.com/package/logrotate-stream
function LogRotate(config) {
    this.config = config;
    this.logDir = utils.createLogDir(config.workDir);
    if (this.config.type && this.config.type === 'raw') {
        stream.Transform.call(this, {readableObjectMode: true, writableObjectMode: true});
    } else {
        stream.Transform.call(this);
    }
    this.pipe(logRotateStream({
        path: path.resolve(this.logDir, config.path || 'ut5-%Y-%m-%d.log'), // Write logs rotated by the day
        symlink: path.resolve(this.logDir, config.symlink || 'ut5.log'), // Maintain a symlink called ut5.log
        compress: config.compress || false
    }));
}

util.inherits(LogRotate, stream.Transform);

LogRotate.prototype._transform = function(data, encoding, callback) {
    let d = data;
    let d2 = '';
    if (this.config.type && this.config.type === 'raw' && data) {
        if ((this.config.individualFormat === 'hex/ascii') && data.mtid === 'frame' && typeof (data.message) === 'string') {
            d2 = '\n' + bufferLog(Buffer.from(data.message, 'hex')) + '\n\n';
        }
        d = JSON.stringify(
            Object.assign({
                time: undefined,
                level: undefined,
                service: undefined,
                name: undefined,
                context: undefined,
                mtid: undefined,
                msg: undefined,
                hostname: undefined,
                pid: undefined
            }, data)
        ) + '\n';
        if (data && data.log) {
            const logName = path.join(this.logDir, `${data.log}-${todayAsDate()}.log`);
            fs.appendFile(logName, d + d2, () => callback(null, d));
        } else {
            callback(null, d);
        }
    } else {
        callback(null, d);
    }
};

module.exports = function(config) {
    return new LogRotate(config);
};
