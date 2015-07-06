var stream = require('stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
// settings : file, size, keep, compress
// refer to: https://www.npmjs.com/package/logrotate-stream
function logRotate(settings) {
    stream.Transform.call(this);
    this.pipe(logRotateStream({
        path: settings.path || './logs/ut5-%Y-%m-%d.log',  // Write logs rotated by the day
        symlink: settings.symlink || './logs/ut5.log',    // Maintain a symlink called ut5.log
        compress: settings.compress || false
    }));
}

util.inherits(logRotate, stream.Transform);

logRotate.prototype._transform = function(data, encoding, callback) {
    this.push(data);
    callback();
};

module.exports = logRotate;
