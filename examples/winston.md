# Winston

``` js
var Logger = require('ut-log');

var log = new Logger({
    type : 'winston',
    name : 'winston_test',
    dependencies : [],
    transports : {
        'file' : {
            filename: './winstonTest.log',
            level: 'error'
        },
        'console' : {
            colorize: 'true',
            level: 'trace'
        }
    }
});

log.info('test'); // logs in console only
log.error('test'); // logs in both file and console
```
