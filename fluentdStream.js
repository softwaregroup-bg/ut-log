const logger = require('fluent-logger');
const stream = require('readable-stream');
const util = require('util');
const fromDate = logger.EventTime.fromDate;

function FluentdStream(config) {
    config = config || {};
    stream.Writable.call(this, {objectMode: true});

    this.sender = logger.createFluentSender(config.prefix || 'ut', {
        host: 'localhost',
        port: 24224,
        timeout: 3.0,
        reconnectInterval: 5000,
        ...config
    });
    this.sender.on('error', console.error); // eslint-disable-line no-console
}

util.inherits(FluentdStream, stream.Writable);

FluentdStream.prototype._write = function(message, encoding, done) {
    if (typeof message === 'string') {
        message = Buffer.from(message, encoding);
    } else {
        message = Object.assign({}, message);
        message['@meta'] = message.$meta;
        delete message.$meta;
    }
    try {
        this.sender.emit(message.context, message, fromDate(message.time), done);
    } catch (error) {
        console.error(error); // eslint-disable-line no-console
    }
};

FluentdStream.prototype.end = function(chunk, encoding, cb) {
    stream.Writable.prototype.end.apply(this, [chunk, encoding, () => {
        this.sender._disconnect();
    }]);
};

module.exports = config => new FluentdStream(config);
