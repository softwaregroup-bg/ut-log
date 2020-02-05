# Bunyan

``` js
var Logger = require('ut-log');

var log = new Logger({
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
});
```
