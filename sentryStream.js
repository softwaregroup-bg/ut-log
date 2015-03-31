var stream = require('stream');
var util = require('util');
var raven = require('raven');

// settings.dsn - mandatory
// settings.patchGlobal - optional
function SentryStream(settings) {
    stream.Writable.call(this, {objectMode: true});
    this.raven = new raven.Client(settings.dsn);
    if (settings.patchGlobal) {
        this.raven.patchGlobal();
    }
}

util.inherits(SentryStream, stream.Writable);

SentryStream.prototype._write = function(obj, encoding, done) {
    this.raven.captureMessage(JSON.stringify(obj));
    done();
};

module.exports = SentryStream;
