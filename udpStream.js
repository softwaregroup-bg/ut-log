const udp = require('dgram');
const stream = require('readable-stream');
const util = require('util');
const uuid = require('uuid').v4;

function UdpStream(config) {
    config = config || {};
    stream.Writable.call(this, {autoDestroy: true, ...config});
    this.socket = udp.createSocket(config.type || 'udp4');
    this.id = Buffer.alloc(16);
    uuid(null, this.id);
    this.socket.on('message', msg => {
        try {
            msg = JSON.parse(msg.toString('utf8'));
            switch (msg && msg.method) {
                case 'uuid': uuid(null, this.id);
            }
        } catch (e) {}
    });
    this.on('error', () => {}); // ignore udp errors
    this.host = config.host;
    this.port = config.port;
    this.max = config.max;
    this.mtu = (config.mtu || 1400) - this.id.length;
}

util.inherits(UdpStream, stream.Writable);

UdpStream.prototype._write = function(message, encoding, done) {
    if (typeof message === 'string') {
        message = Buffer.from(message, encoding);
    }
    if (this.max && message && message.length > this.max) {
        done();
        return;
    }
    const id = this.id.slice();
    const send = (start, length, cb) => {
        this.socket.send(Buffer.concat([id, message.slice(start, start + length)]), this.port, this.host, cb);
    };
    const sendFrame = (start, length) => {
        if (start + length >= message.length) {
            send(start, message.length - start, done);
        } else {
            send(start, length, err => {
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

UdpStream.prototype._destroy = function(error, callback) {
    this.socket.close(err => callback && callback(err || error));
};

module.exports = config => new UdpStream(config);
