var repl = require('repl').start({prompt: '> '});
var wire = require('wire');
var path = require('path');
wire({
    logRotateStream: {
        create: {
            module: 'ut-log/logRotateStream',
            args: {
                path: path.join('logs', 'ut5_%Y-%m-%d_%h-%M.log'),
                symlink: path.join('logs', 'ut5.log'),
                compress: true
            }
        }
    },
    bunyan: {
        create: {
            module: 'ut-log',
            args: {
                type: 'bunyan',
                name: 'bunyan_console_test',
                streams: [
                    {
                        level: 'trace',
                        stream: 'process.stdout'
                    },
                    {
                        level: 'trace',
                        stream: {$ref: 'logRotateStream'}
                    }
                ]
            }
        }
    }
}, {require: require})
.then(function contextLoaded(context) {
    repl.context.c = context;
    var loggers = [
        context.bunyan.createLog('info', {name: 'bunyan log 1', context: 'bunyan log 1 context'}),
        context.bunyan.createLog('info', {name: 'bunyan log 2', context: 'bunyan log 2 context'}),
        context.bunyan.createLog('info', {name: 'bunyan log 3', context: 'bunyan log 3 context'}),
        context.bunyan.createLog('info', {name: 'bunyan log 4', context: 'bunyan log 4 context'}),
        context.bunyan.createLog('info', {name: 'bunyan log 5', context: 'bunyan log 5 context'})
    ];
    setInterval(function() {
        loggers[Math.floor(Math.random() * loggers.length)].info('test');
    }, 9000);
})
.otherwise(function(er) {
    repl.context.err = er;
});
