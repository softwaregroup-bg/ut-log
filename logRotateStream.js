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
    if (this.config.type && this.config.type === 'raw') {
        var d = JSON.stringify(data) + '\n';
        if (data && data.log) {
            var logName = path.join(this.logDir, `${data.log}-${todayAsDate()}.log`);
            fs.appendFile(logName, d, () => true);
        }
    }
    callback(null, d);
};

module.exports = function(config) {
    return new LogRotate(config);
};
