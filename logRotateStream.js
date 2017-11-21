var stream = require('readable-stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
var path = require('path');
var fs = require('fs');
var utils = require('./utils');
const todayAsDateInit = () => {
    var current;
    var lastUpdated = Date.now() - 1;

    return () => {
        if (lastUpdated < Date.now()) {
            var d = new Date();
            current = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()].join('-');
            lastUpdated = Date.now() + 600000;
        }
        return current;
    };
};
const todayAsDate = todayAsDateInit();

function bufferLog(buffer) {
    return (buffer || [])
    .reduce((a, hex, idx) => {
        var curIdx = Math.floor(idx / 16);
        var buf = Buffer.from([hex]);
        a[curIdx] = (a[curIdx] || {hex: [], str: []});
        a[curIdx].hex.push(buf.toString('hex'));
        a[curIdx].str.push(buf.toString('ascii'));
        return a;
    }, [])
    .reduce((a, cur) => {
        var hex = cur.hex.concat((new Array(16)).fill('  ')).slice(0, 16).join(' ');
        var str = cur.str.join('');
        a.push(`${hex}|${str}`);
        return a;
    }, [])
    .join('\n');
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
        path: path.resolve(this.logDir, config.path || 'ut5-%Y-%m-%d.log'),  // Write logs rotated by the day
        symlink: path.resolve(this.logDir, config.symlink || 'ut5.log'),    // Maintain a symlink called ut5.log
        compress: config.compress || false
    }));
}

util.inherits(LogRotate, stream.Transform);

LogRotate.prototype._transform = function(data, encoding, callback) {
    var d = data;
    var d2;
    if (this.config.type && this.config.type === 'raw') {
        if ((this.config.individualFormat === 'hex/ascii') && data.mtid === 'frame' && typeof (data.message) === 'string') {
            d2 = bufferLog(Buffer.from(data.message, 'hex')) + '\n';
        }
        d = JSON.stringify(data) + '\n';
        if (data && data.log) {
            var logName = path.join(this.logDir, `${data.log}-${todayAsDate()}.log`);
            fs.appendFile(logName, d, () => true);
            if (d2) {
                fs.appendFile(logName, d2, () => true);
            }
        }
    }
    if (d2) {
        this.push(d);
        callback(null, d2);
    } else {
        callback(null, d);
    }
};

module.exports = function(config) {
    return new LogRotate(config);
};
