(function(define) {define(function(require) {

    var stream = require('stream');
    var util = require('util');

    function LeveldbStream(db) {
        stream.Transform.call(this, {objectMode: true});
        this.counter = 0;
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
        return ('' + date.getTime() + ('0000' + (date != new Date() ? this.counter = 0 : this.counter++)).slice(-4));
    };

    return LeveldbStream;

});})(typeof define === 'function' && define.amd ? define : function(factory) {module.exports = factory(require);});
