var logStash = require('bunyan-logstash-tcp');

module.exports = function(config) {
    return logStash.createStream(config);
};
