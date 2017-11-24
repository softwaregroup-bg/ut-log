var stream = require('readable-stream');
var util = require('util');
var LevelWriteStream = require('level-writestream');
var levelup = require('levelup');
var leveldown = require('leveldown');
var path = require('path');
var utils = require('./utils');

function LeveldbStream(config) {
    var logDir = utils.createLogDir(config.workDir);
    var db = levelup(leveldown(path.resolve(logDir, config.dbPath || 'leveldb')));
    stream.Transform.call(this, {objectMode: true});
    this.counter = 0;
    this.logTime = (new Date()).getTime();
    LevelWriteStream(db);
    this.pipe(db.createWriteStream({valueEncoding: 'json'}));
}

util.inherits(LeveldbStream, stream.Transform);

LeveldbStream.prototype._transform = function(logMessage, encoding, done) {
    try { logMessage = JSON.parse(logMessage); } catch (e) {} // winston pipes stringified JSONs
    this.push({
        key: this.getKey(new Date(logMessage.timestamp || logMessage.time)),
        value: logMessage
    });
    done();
};

LeveldbStream.prototype.getKey = function(date) {
    if (this.logTime === (date = date.getTime())) {
        this.counter++;
    } else {
        this.counter = 0;
        this.logTime = date;
    }
    return ('' + date + ('0000' + this.counter).slice(-4));
};

module.exports = function(config) {
    return new LeveldbStream(config);
};
