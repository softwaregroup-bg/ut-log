var repl = require('repl').start({prompt: '> '});
var wire = require('wire');
var m = wire({
    consoleHost: '127.0.0.1',
    consolePort: 30001,
    leveldb : {
        create: {
            module: 'level',
            args: ['./leveldb/logs']
        }
    },
    leveldbStream : {
        create: {
            module: 'ut-log/leveldbStream',
            args: [{$ref: 'leveldb'}]
        }
    },
    socketStream:{
        create: {
            module:'ut-log/socketStream',
            args:{
                host: {$ref: 'consoleHost'},
                port: {$ref: 'consolePort'},
                objectMode: true
            }
        }
    },
    winston : {
        create : {
            module  : 'ut-log',
            args    : {
                type : 'winston',
                name : 'winston_console_test',
                streams :  [
                    {
                        level: 'trace',
                        stream: {$ref:'socketStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        stream: {$ref:'leveldbStream'},
                        type: 'raw'
                    }
                ]
            }
        }
    },
    bunyan : {
        create : {
            module  : 'ut-log',
            args    : {
                type : 'bunyan',
                name : 'bunyan_console_test',
                streams :  [
                    {
                        level: 'trace',
                        stream: {$ref:'socketStream'},
                        type: 'raw'
                    },
                    {
                        level: 'trace',
                        stream: {$ref:'leveldbStream'},
                        type: 'raw'
                    }
                ]
            }
        }
    },
    console: {
        create: 'ut-port-console',
        properties: {
            config: {
                host: {$ref: 'consoleHost'},
                port: {$ref: 'consolePort'},
                id: 'debug_console'
            },
            db  : {$ref: 'leveldb'}
        },
        init: 'init',
        ready:'start'
    }
}, {require: require})
.then(function contextLoaded(context) {
    w = repl.context.w  = context.winston.createLog('trace', {name: 'winston log', context: 'winston log context'});
    b = repl.context.b  = context.bunyan.createLog('trace', {name: 'bunyan log', context: 'bunyan log context'});
})
.otherwise(function(er) {
    err = repl.context.err = er
});
