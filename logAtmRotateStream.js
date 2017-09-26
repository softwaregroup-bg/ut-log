var stream = require('readable-stream');
var util = require('util');
var path = require('path');
var fs = require('fs');
var utils = require('./utils');
// let exampleAtmMapping = {
//     connId: {
//         masterKvv: '.....',
//         queue: []
//     }
// };

var atmMapping = {};

function appendFile(dir, filePrefix) {
    var prefix = [filePrefix];
    return (file, data, cb) => {
        var callback = cb || function() {};
        fs.appendFile(path.join(dir, prefix.concat(file).join('-')), data, callback);
    };
}

function LogFilterRotate(config) {
    stream.Transform.call(this);
    this.config = config;
    this.appendToFile = appendFile(
        utils.createLogDir(config.workDir),
        (this.config.filePrefix ? this.config.filePrefix : '-')
    );
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
                }
                atmMapping[conId] = {stream: undefined, masterKvv: undefined, queue: [data]};
            } else {
                if (!atmMapping[conId].masterKvv) {
                    atmMapping[conId].queue.push(data);
                    if (j.$meta.opcode && j.$meta.opcode === 'keyReadKvv' && j.message.masterKvv) {
                        atmMapping[conId].masterKvv = j.message.masterKvv;
                        atmMapping[conId].queue.map((val) => {
                            this.appendToFile(`${atmMapping[conId].masterKvv}-%Y-%m-%d.log`, val);
                        });
                        atmMapping[conId].queue = [];
                    }
                } else {
                    this.appendToFile(`${atmMapping[conId].masterKvv}-%Y-%m-%d.log`, data);
                }
            }
        }
    }
    callback();
};

module.exports = function(config) {
    return new LogFilterRotate(config);
};
