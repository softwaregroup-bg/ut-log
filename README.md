
# ut-log#

'ut-log' is a module aimed to provide logging functionality for the UT5 implementations.
A basic log instance can be obtained with the following code:

```js
var utLog = require('ut-log');
var utLogConfig = {
    type: 'bunyan',
    streams: [
        {
            level: 'trace',
            stream: 'process.stdout'
        }
    ]
};
var logFactory = new utLog(utLogConfig);
var log = logFactory.createLog('info', {name: 'a', context: 'b'});
```

- **ut-log** module exposes a constructor for creating logFactory objects 

- The configuration object that the **ut-log** constructor accepts as an argument has to have properties **type** and **streams** where:
    -  **type** is a string specifying which vendor node module will be used for logging. The possible values are: [bunyan](https://github.com/trentm/node-bunyan) or [winston](https://github.com/winstonjs/winston)
    - **streams** is an array of objects where each object specifies a single logging transport. See the [streams](#streams) section for more information.

- The logFactory object has a single method (**createLog**) which has to be called in order for a log instance to get obtained. logFactory.createLog method has 2 arguments: **level** and **params**
    -  **level** is a string specifying the minimum logging level the logger will be able to log to.  The possible values for this argument are: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
    Each log level has a weight and the priority of the levels is as listed above.

Once having the **log** instantiated it can be used to log data across all specified streams simultaneously (in this case only the NodeJS console through *process.stdout*). Logging itself happens by calling one of the log's methods (logFactory.createLog returns an object with each logging level assigned as a method). In our case, because we set 'info' as a minimum logging level,  the 'log' object will be equipped with 4 methods: 

    log.info
    log.warn
    log.error
    log.fatal
To log something, pass the data that needs to be log as an argument to some of the functions listed above. E.g:
```js
log.info('log message');
```
Doing so will log the data to all specified streams with a minimum level equal to 'info' or higher. 
For optimal performance all log method calls should always be verified before being called so that changing the global logFactory object's minimum log level should not break the code and high volume log data will not occupy memory.
I.e. logging should always happen like:
```js
log.info && log.info('log message');
```

## **Streams**
-- Not explained (to do)