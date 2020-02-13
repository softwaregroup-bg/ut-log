const io = require('socket.io-client');
const stream = require('readable-stream');
const util = require('util');

function SocketStream(config) {
    config = config || {};
    stream.Writable.call(this, config);

    this._host = config.host || (process.browser ? window.location.hostname : 'localhost');
    this._port = config.port || 30001;
    this._namespace = config.namespace || 'log';
    this._eventName = config.eventName || 'log';
    this._protocol = config.protocol || 'http:';
    this.socket = io(util.format('%s//%s:%s/%s', this._protocol, this._host, this._port, this._namespace), config.io);
}

util.inherits(SocketStream, stream.Writable);

SocketStream.prototype._write = function(logMessage, encoding, done) {
    if (this.socket.sendBuffer.length <= 50) {
        try { logMessage = JSON.parse(logMessage); } catch (e) {} // winston pipes stringified JSONs
        this.socket.emit(this._eventName, logMessage);
        done();
    } else {
        done();
    }
};

SocketStream.prototype._destroy = function(error, callback) {
    this.socket.close(err => callback && callback(err || error));
};

module.exports = function(config) {
    return new SocketStream(config);
};
