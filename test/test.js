//require('repl').start({useGlobal:true})

var wire = require('wire');

m = wire({
    winston : {
        create : {
            module  : 'ut-log',
            args    : {
                type : 'winston',
                name : 'winston_test',
                dependencies : [],
                transports : {
                    'console' : {
                        colorize: 'true',
                        level: 'trace'
                    },
                    'file' : {
                        filename: './winstonTest.log',
                        level: 'info'
                    },
                    'webhook' : {
                        host: '127.0.0.1',
                        port: 30001,
                        level: 'debug'
                    }
                }
            }
        }
    },
    bunyan : {
        create : {
            module  : 'ut-log',
            args    : {
                type : 'bunyan',
                name : 'bunyan_test',
                streams :  [
                    {
                        level: 'info',
                        stream: 'process.stdout'
                    },
                    {
                        level: 'error',
                        path: './bunyanTest.log'
                    }
                ]
            }
        }
    }
}, {require : require});

m.then(function(c) {
    winston = c.winston;
    bunyan  = c.bunyan;
}).otherwise(function(error) {
    err = error;
});
