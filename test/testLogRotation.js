var path = require('path');
var logRotateStream = require('../logRotateStream')({workDir: path.resolve(__dirname)});
var Log = require('../index');
var bunyan = new Log({
    type: 'bunyan',
    name: 'bunyan_console_test',
    streams: [{
        level: 'trace',
        stream: 'process.stdout'
    }, {
        level: 'trace',
        stream: logRotateStream
    }]
});

var loggers = [
    bunyan.createLog('info', {
        name: 'bunyan log 1',
        context: 'bunyan log 1 context'
    }),
    bunyan.createLog('info', {
        name: 'bunyan log 2',
        context: 'bunyan log 2 context'
    }),
    bunyan.createLog('info', {
        name: 'bunyan log 3',
        context: 'bunyan log 3 context'
    }),
    bunyan.createLog('info', {
        name: 'bunyan log 4',
        context: 'bunyan log 4 context'
    }),
    bunyan.createLog('info', {
        name: 'bunyan log 5',
        context: 'bunyan log 5 context'
    })
];

loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
loggers[Math.floor(Math.random() * loggers.length)].info('test');
