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
                    'file' : {
                        filename: './winstonTest.log',
                        level: 'trace'
                    },
                    'console' : {
                        colorize: 'true',
                        level: 'trace'
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
