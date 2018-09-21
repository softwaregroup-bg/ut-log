const logger = require('fluent-logger');
const stream = require('readable-stream');
const util = require('util');

function FluentdStream(config) {
    config = config || {};
    stream.Writable.call(this, {objectMode: true});

    this.sender = logger.createFluentSender('ut', {
        host: 'localhost',
        port: 24224,
        timeout: 3.0,
        reconnectInterval: 600000, // 10 minutes
        ...config
    });
}

util.inherits(FluentdStream, stream.Writable);

FluentdStream.prototype._write = function(message, encoding, done) {
    if (typeof message === 'string') {
        message = Buffer.from(message, encoding);
    }
    this.sender.emit(message, done);
};

FluentdStream.prototype.end = function(chunk, encoding, cb) {
    stream.Writable.prototype.end.apply(this, [chunk, encoding, () => {
        this.sender._disconnect();
    }]);
};

module.exports = config => new FluentdStream(config);
