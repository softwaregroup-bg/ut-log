var logStash = require('bunyan-logstash-tcp');

module.exports = function(config, onError) {
    return logStash.createStream(config).on('error', () => {});
};
