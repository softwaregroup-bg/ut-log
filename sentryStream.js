/* eslint no-console:0 */
var stream = require('readable-stream');
var util = require('util');
var raven = require('raven');

// config.dsn (string) mandatory
// config.patchGlobal (boolean) optional (dafault: false) - if global exceptions should be handled
// config.logger (string) optional (default: 'root') - if the sentry logger should have an unique identity. i.e. 'impl-name'
function SentryStream(config) {
    stream.Writable.call(this, {objectMode: true});
    try {
        this.raven = new raven.Client(config.dsn, {
            logger: config.logger || 'root',
            dataCallback: function(data) {
                // modify data if needed
                return data;
            }
        });
        if (config.patchGlobal) {
            this.raven.install(function() {
                console.log('Sentry: Uncaught exception occured...');
                // process.exit(1);
            });
        }
        // this.raven.on('logged', function() {
        //     console.log('A message has been logged to Sentry');
        // });
        this.raven.on('error', function(e) {
            console.error('Sentry error : ', e.message);
            // console.dir(e);
        });
    } catch (e) {
        console.error(e);
        this.raven = null;
    }
}

util.inherits(SentryStream, stream.Writable);

SentryStream.prototype._write = function(logMessage, encoding, done) {
    if (this.raven) {
        if (logMessage.jsException) {
            this.raven.captureException(logMessage.jsException);
        } else {
            if (typeof logMessage === 'string') {
                if (logMessage.indexOf('jsException') !== -1) { // error already sent through winston logger
                    return done();
                }
            } else {
                try {
                    logMessage = JSON.stringify(logMessage);
                } catch (e) {
                    logMessage = 'logMessage stringify error';
                }
            }
            this.raven.captureMessage(logMessage);
        }
    }
    done();
};

module.exports = function(config) {
    return new SentryStream(config);
};
