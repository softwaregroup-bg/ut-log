const http = require('http');
const tap = require('tap');

tap.test('streams', t => {
    const sentryStream = require('../sentryNodeStream')({
        dsn: 'http://a0b4ec8148344128a16eab394a09c570@sentry.k8s.softwaregroup-bg.com/3',
        patchGlobal: false,
        logger: 'ut-log'
    }, {
        env: 'dev',
        version: require('../package').version
    });
    t.ok(sentryStream, 'Create sentry stream');

    const consoleHost = '127.0.0.1';
    const consolePort = 30001;
    const socketStream = require('../socketStream')({
        host: consoleHost,
        port: consolePort,
        objectMode: true,
        io: {
            transportOptions: {
                polling: {
                    agent: new http.Agent({timeout: 1000})
                }
            }
        }
    });
    t.ok(socketStream, 'Create socket stream');

    const Log = require('../index');
    const winston = new Log({
        type: 'winston',
        name: 'winston_console_test',
        workDir: __dirname,
        streams: [{
            level: 'trace',
            stream: socketStream,
            type: 'raw'
        }, {
            level: 'error',
            stream: sentryStream,
            type: 'raw'
        }, {
            level: 'trace',
            type: 'process.stdout'
        }]
    });
    t.ok(winston, 'Create winston log factory');

    const bunyan = new Log({
        type: 'bunyan',
        name: 'bunyan_console_test',
        workDir: __dirname,
        streams: [{
            level: 'trace',
            stream: socketStream,
            type: 'raw'
        }, {
            level: 'error',
            stream: sentryStream,
            type: 'raw'
        }, {
            level: 'trace',
            type: 'process.stdout'
        }]
    });
    t.ok(bunyan, 'Create bunyan log factory');

    const winstonLog = winston.createLog('trace', {
        name: 'winston log',
        context: 'winston log context'
    });
    t.ok(winstonLog, 'Create winston logger');

    const bunyanLog = bunyan.createLog('trace', {
        name: 'bunyan log',
        context: 'bunyan log context'
    });
    t.ok(bunyanLog, 'Create bunyan logger');

    try {
        bunyanLog.asdf();
    } catch (e) {
        bunyanLog.error(e);
    }

    socketStream.destroy();
    sentryStream.destroy();
    t.end();
});
