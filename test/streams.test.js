const http = require('http');
const tap = require('tap');

tap.test('streams', t => {
    const streams = [{
        level: 'error',
        stream: '../sentryNodeStream',
        streamConfig: {
            dsn: 'http://a0b4ec8148344128a16eab394a09c570@sentry.k8s.softwaregroup-bg.com/3',
            patchGlobal: false,
            logger: 'ut-log'
        },
        type: 'raw'
    }, {
        level: 'trace',
        stream: 'process.stdout',
        type: 'raw',
        streamConfig: {
            mode: 'dev'
        }
    }, {
        level: 'trace',
        stream: '../udpStream',
        streamConfig: {
            host: 'localhost',
            port: 30001
        }
    }, {
        level: 'trace',
        stream: '../socketStream',
        streamConfig: {
            host: '127.0.0.1',
            port: 30001,
            objectMode: true,
            io: {
                transportOptions: {
                    polling: {
                        agent: new http.Agent({
                            timeout: 1000
                        })
                    }
                }
            }
        }
    }];

    const Log = require('../index');
    const winston = new Log({
        type: 'winston',
        name: 'winston_console_test',
        workDir: __dirname
    });
    t.ok(winston, 'Create winston log factory');

    const bunyan = new Log({
        type: 'bunyan',
        name: 'bunyan_console_test',
        env: 'dev',
        version: require('../package').version,
        workDir: __dirname,
        streams
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

    bunyanLog.trace('Trace message');
    bunyanLog.debug('Debug message');
    bunyanLog.info('Info message');
    bunyanLog.warn('Warining message');
    bunyanLog.error('Error message');
    bunyanLog.fatal('Fatal message');

    try {
        bunyanLog.asdf();
    } catch (e) {
        bunyanLog.error(e);
    }

    bunyan.destroy();
    winston.destroy();

    t.end();
});
