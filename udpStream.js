var udp = require('dgram');
var stream = require('readable-stream');
var util = require('util');

function UdpStream(config) {
    config = config || {};
    stream.Writable.call(this, config);
    this.socket = udp.createSocket(config.type || 'udp4');
    this.host = config.host;
    this.port = config.port;
    this.mtu = config.mtu || 1400;
}

util.inherits(UdpStream, stream.Writable);

UdpStream.prototype._write = function(message, encoding, done) {
    if (typeof message === 'string') {
        message = new Buffer(message, encoding);
    }
    let sendFrame = (start, length) => {
        if (start + length >= message.length) {
            this.socket.send(message, start, message.length - start, this.port, this.host, done);
        } else {
            this.socket.send(message, start, length, this.port, this.host, err => {
                if (err) {
                    done(err);
                } else {
                    setImmediate(() => sendFrame(start + length, length));
                }
            });
        }
    };
    sendFrame(0, this.mtu);
};

UdpStream.prototype.end = function(chunk, encoding, cb) {
    stream.Writable.prototype.end.apply(this, [chunk, encoding, () => {
        this.socket.close(cb);
    }]);
};

module.exports = config => new UdpStream(config);
