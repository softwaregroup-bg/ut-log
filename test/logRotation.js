var repl = require('repl').start({prompt: '> '});
var wire = require('wire');
var path = require('path');
var m = wire({
    bunyan : {
        create : {
            module  : 'ut-log',
            args    : {
                type : 'bunyan',
                name : 'bunyan_console_test',
                streams :  [
                    {
                        level: 'trace',
                        stream: 'process.stdout'
                    },
                    {
                        type: 'rotating-file',
                        path: path.join(__dirname, 'logs', 'test.log'),
                        period: '20000ms', // 20 seconds
                        count: 10          // keep 10 back copies
                    }
                ]
            }
        }
    }
}, {require: require})
.then(function contextLoaded(context) {
        var loggers = [
                context.bunyan.createLog('info', {name: 'bunyan log 1', context: 'bunyan log 1 context'}),
                context.bunyan.createLog('info', {name: 'bunyan log 2', context: 'bunyan log 2 context'}),
                context.bunyan.createLog('info', {name: 'bunyan log 3', context: 'bunyan log 3 context'}),
                context.bunyan.createLog('info', {name: 'bunyan log 4', context: 'bunyan log 4 context'}),
                context.bunyan.createLog('info', {name: 'bunyan log 5', context: 'bunyan log 5 context'})
            ]
        ;
    setInterval(function() {
        loggers[Math.floor(Math.random()*loggers.length)].info('test');
    }, 9000);
})
.otherwise(function(er) {
    err = repl.context.err = er
});
