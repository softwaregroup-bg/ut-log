var UtLog = require('../index');
var utLogConfig = {
    type: 'bunyan',
    streams: [
        {
            level: 'trace',
            stream: 'process.stdout'
        }
    ]
};
var logFactory = new UtLog(utLogConfig);
logFactory.createLog('error', {name: 'test name', context: 'test context'});
