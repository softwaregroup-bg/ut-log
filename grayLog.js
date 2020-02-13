const greylog = require('gelf-stream');

module.exports = function(config) {
    return greylog.forBunyan(config && config.host, config && config.port, config);
};
