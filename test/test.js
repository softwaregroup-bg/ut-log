require('repl').start({useGlobal:true});
var utLog = require('ut-log');
var utLogConfig = {
    type: 'bunyan',
    streams: [
        {
            level: 'trace',
            stream: 'process.stdout'
        }
    ]
};
var logFactory = new utLog(utLogConfig);
var log = logFactory.createLog('error', {name: 'test name', context: 'test context'});