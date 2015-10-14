var stream = require('stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
// config : file, size, keep, compress
// refer to: https://www.npmjs.com/package/logrotate-stream
function logRotate(config) {
    stream.Transform.call(this);
    this.pipe(logRotateStream({
        path: config.path || './logs/ut5-%Y-%m-%d.log',  // Write logs rotated by the day
        symlink: config.symlink || './logs/ut5.log',    // Maintain a symlink called ut5.log
        compress: config.compress || false
    }));
}

util.inherits(logRotate, stream.Transform);

logRotate.prototype._transform = function(data, encoding, callback) {
    this.push(data);
    callback();
};

module.exports = logRotate;
