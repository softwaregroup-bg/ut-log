var logStash = require('bunyan-logstash-tcp');

module.exports = function(config, onError) {
    var s = logStash.createStream(config);
    s.on('error', onError);
    return s;
};
