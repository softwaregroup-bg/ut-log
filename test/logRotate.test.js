const tap = require('tap');
const path = require('path');

tap.test('logRotate', t => {
    const logRotateStream = require('../logRotateStream')({workDir: path.resolve(__dirname)});
    t.ok(logRotateStream, 'Create log rotate stream');

    const Log = require('../index');
    const bunyan = new Log({
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
    t.ok(bunyan, 'Create bunyan log factory');

    const loggers = [
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
    t.equal(loggers.length, 5, 'Create 5 winston loggerers');

    loggers[0].info('test');
    loggers[1].info('test');
    loggers[2].info('test');
    loggers[3].info('test');
    loggers[4].info('test');

    t.end();
});
