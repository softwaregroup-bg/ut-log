var stream = require('stream');
var util = require('util');
var raven = require('raven');

// settings.dsn (string) mandatory
// settings.patchGlobal (boolean) optional (dafault: false) - if global exceptions should be handled
// settings.logger (string) optional (default: 'root') - if the sentry logger should have an unique identity. i.e. 'impl-name'
function SentryStream(settings) {
    stream.Writable.call(this, {objectMode: true});
    try {
        this.raven = new raven.Client(settings.dsn, {
            logger: settings.logger || 'root',
            dataCallback: function(data) {
                // modify data if needed
                return data;
            }
        });
        if (settings.patchGlobal) {
            this.raven.patchGlobal(function() {
                console.log('Sentry: Uncaught exception occured...');
                //process.exit(1);
            });
        }
        this.raven.on('logged', function() {
            console.log('A message has been logged to Sentry');
        });
        this.raven.on('error', function(e) {
            console.error('Sentry error : ', e.message);
            // console.dir(e);
        })
    } catch (e) {
        console.error(e)
        this.raven = null;
    }
}

util.inherits(SentryStream, stream.Writable);

SentryStream.prototype._write = function(logMessage, encoding, done) {
    if (!this.raven) {
        //
    } else if (logMessage.jsException) {
        this.raven.captureError(logMessage.jsException);
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
    done();
};

module.exports = SentryStream;
