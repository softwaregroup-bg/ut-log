var stream = require('stream');
var util = require('util');
var LevelWriteStream = require('level-writestream');

function LeveldbStream(db) {
    stream.Transform.call(this, {objectMode: true});
    this.counter = 0;
    this.logTime = (new Date()).getTime();
    LevelWriteStream(db);
    this.pipe(db.createWriteStream({valueEncoding : 'json'}));
}

util.inherits(LeveldbStream, stream.Transform);

LeveldbStream.prototype._transform = function(logMessage, encoding, done) {
    try {logMessage = JSON.parse(logMessage)} catch(e) {}
    this.push({
        key: this.getKey(new Date(logMessage.timestamp || logMessage.time)),
        value: logMessage
    });
    done();
};

LeveldbStream.prototype.getKey = function(date) {
    if(this.logTime == (date = date.getTime())) {
        this.counter++
    } else {
        this.counter = 0;
        this.logTime = date;
    }
    return ('' + date + ('0000' + this.counter).slice(-4));
};

module.exports = LeveldbStream;