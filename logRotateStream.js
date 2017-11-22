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
            current = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-');
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
    if (this.config.type && this.config.type === 'raw' && data) {
        let dataOrdered = Object.assign({time: data.time}, data); // put time prop first (most left)
        let dataString = JSON.stringify(dataOrdered) + '\n';
        if (dataOrdered.log) {
            let logName = path.join(this.logDir, `${dataOrdered.log}-${todayAsDate()}.log`);
            fs.appendFile(logName, dataString, () => true);
        }
        callback(null, dataString);
    } else {
        callback(null, data);
    }
};

module.exports = function(config) {
    return new LogRotate(config);
};
