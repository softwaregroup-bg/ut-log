var io = require('socket.io-client');
var stream = require('stream');
var util = require('util');

function SocketStream(opt) {
    opt = opt || {};
    stream.Writable.call(this, opt);

    this._host = opt.host || 'localhost';
    this._port = opt.port || 30001;
    this._namespace = opt.namespace || 'log';
    this._eventName = opt.eventName || 'log';
    this.socket = io(util.format('http://%s:%s/%s', this._host, this._port, this._namespace));
}

util.inherits(SocketStream, stream.Writable);

SocketStream.prototype._write = function (obj, encoding, done) {
    if (this.socket.sendBuffer.length <= 50) {
        this.socket.emit(this._eventName, obj);
        done();
    } else {
        done();
    }
};

module.exports = SocketStream;
