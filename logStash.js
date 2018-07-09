var logStash = require('bunyan-logstash-tcp');

module.exports = function(config, onError) {
    var s = logStash.createStream(config);
    var i = setInterval(() => (s.send({ping: true})), 5 * 60000);

    s.on('error', (err) => {
        clearInterval(i);
        onError(err);
    });
    return s;
};
