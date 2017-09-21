var stream = require('readable-stream');
var util = require('util');
var logRotateStream = require('stream-file-archive');
var path = require('path');
var utils = require('./utils');
// let exampleAtmMapping = {
//     connId: {
//         masterKvv: '.....',
//         stream: 'stream object',
//         queue: []
//     }
// };

var atmMapping = {};

function LogFilterRotate(config) {
    stream.Transform.call(this);
    this.config = config;
    this.logDir = utils.createLogDir(config.workDir);
}

util.inherits(LogFilterRotate, stream.Transform);

LogFilterRotate.prototype._transform = function(data, encoding, callback) {
    var t = data.toString();
    if ((t.indexOf('ncr') >= 0) && (t.indexOf('conId') >= 0)) {
        try {
            var j = JSON.parse(t);
        } catch (e) {}
        if (j.name === 'ncr') {
            var conId = (j.context && j.context.conId) || j.$meta.conId;
            if (j.$meta && j.$meta.opcode && j.$meta.opcode.indexOf('.connected') >= 0) {
                if (atmMapping[conId] && atmMapping[conId].stream) {
                    atmMapping[conId].stream.end();
                }
                atmMapping[conId] = {stream: undefined, masterKvv: undefined, queue: [data]};
            } else {
                if (!atmMapping[conId].stream) {
                    atmMapping[conId].queue.push(data);
                    if (j.$meta.opcode && j.$meta.opcode === 'keyReadKvv' && j.message.masterKvv) {
                        atmMapping[conId].masterKvv = j.message.masterKvv;
                        atmMapping[conId].stream = logRotateStream({
                            path: path.resolve(this.logDir, `atm-${atmMapping[conId].masterKvv}-%Y-%m-%d.log`),  // Write logs rotated by the day
                            compress: this.config.compress || false
                        });
                        atmMapping[conId].queue.map((val) => {
                            atmMapping[conId].stream.write(val);
                        });
                        atmMapping[conId].queue = [];
                    }
                } else {
                    atmMapping[conId].stream.write(data);
                }
            }
        }
    }
    callback();
};

module.exports = function(config) {
    return new LogFilterRotate(config);
};
