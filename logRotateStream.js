var stream = require('readable-stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
var path = require('path');
var fs = require('fs');
var utils = require('./utils');
// config : file, size, keep, compress
// refer to: https://www.npmjs.com/package/logrotate-stream
function LogRotate(config) {
    this.logDir = utils.createLogDir(config.workDir);
    stream.Transform.call(this);
    this.pipe(logRotateStream({
        path: path.resolve(this.logDir, config.path || 'ut5-%Y-%m-%d.log'),  // Write logs rotated by the day
        symlink: path.resolve(this.logDir, config.symlink || 'ut5.log'),    // Maintain a symlink called ut5.log
        compress: config.compress || false
    }));
}

util.inherits(LogRotate, stream.Transform);

LogRotate.prototype._transform = function(data, encoding, callback) {
    var d;
    try {
        d = JSON.parse(data.toString());
    } catch (e) {}
    if (d && d.log) {
        var logName = path.join(this.logDir, `${d.log}.log`);
        fs.appendFile(logName, data, () => (true));
    }
    this.push(data);
    callback();
};

module.exports = function(config) {
    return new LogRotate(config);
};
