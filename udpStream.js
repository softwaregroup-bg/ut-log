var udp = require('dgram');
var stream = require('readable-stream');
var util = require('util');

function UdpStream(config) {
    config = config || {};
    stream.Writable.call(this, config);
    this.socket = udp.createSocket(config.type || 'udp4');
    this.host = config.host;
    this.port = config.port;
}

util.inherits(UdpStream, stream.Writable);

UdpStream.prototype._write = function(message, encoding, done) {
    if (typeof message === 'string') {
        message = new Buffer(message, encoding);
    }
    this.socket.send(message, 0, message.length, this.port, this.host, done);
};

UdpStream.prototype.end = function(chunk, encoding, cb) {
    stream.Writable.prototype.end.apply(this, [chunk, encoding, () => {
        this.socket.close(cb);
    }]);
};

module.exports = config => new UdpStream(config);
