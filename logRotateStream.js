var stream = require('readable-stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
var path = require('path');
// config : file, size, keep, compress
// refer to: https://www.npmjs.com/package/logrotate-stream
function LogRotate(config) {
    stream.Transform.call(this);
    this.pipe(logRotateStream({
        path: path.resolve(config.logDir, config.path || 'ut5-%Y-%m-%d.log'),  // Write logs rotated by the day
        symlink: path.resolve(config.logDir, config.symlink || 'ut5.log'),    // Maintain a symlink called ut5.log
        compress: config.compress || false
    }));
}

util.inherits(LogRotate, stream.Transform);

LogRotate.prototype._transform = function(data, encoding, callback) {
    this.push(data);
    callback();
};

module.exports = function(config) {
    return new LogRotate(config);
};
