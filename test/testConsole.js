/* eslint no-process-exit:0 */
var path = require('path');
var leveldbStream = require('../leveldbStream')({logDir: path.join(__dirname, 'ut-log')});
var sentryStream = require('../sentryStream')({
    dsn: 'http://a17d5fc9941b496faf2fbb043e42f246:b305a16bff714c1e9c1fc37dc90597b3@sentry:5002/2',
    patchGlobal: false,
    logger: 'impl-test'
});
var consoleHost = '127.0.0.1';
var consolePort = 30001;

var socketStream = require('../socketStream')({
    host: consoleHost,
    port: consolePort,
    objectMode: true
});

var Log = require('../index');
var winston = new Log({
    type: 'winston',
    name: 'winston_console_test',
    workDir: __dirname,
    streams: [{
        level: 'trace',
        stream: socketStream,
        type: 'raw'
    }, {
        level: 'trace',
        stream: leveldbStream,
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

var bunyan = new Log({
    type: 'bunyan',
    name: 'bunyan_console_test',
    workDir: __dirname,
    streams: [{
        level: 'trace',
        stream: socketStream,
        type: 'raw'
    }, {
        level: 'trace',
        stream: leveldbStream,
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

winston.createLog('trace', {
    name: 'winston log',
    context: 'winston log context'
});
var b = bunyan.createLog('trace', {
    name: 'bunyan log',
    context: 'bunyan log context'
});

try {
    b.asdf();
} catch (e) {
    b.error(e);
}

process.exit(0);
