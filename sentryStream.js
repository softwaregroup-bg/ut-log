var stream = require('stream');
var util = require('util');
var raven = require('raven');

// settings.dsn (string) mandatory
// settings.patchGlobal (boolean) optional (dafault: false) - if global exceptions should be handled
// settings.logger (string) optional (default: 'root') - if the sentry logger should have an unique identity. i.e. 'impl-name'
function SentryStream(settings) {
    stream.Writable.call(this, {objectMode: true});
    this.raven = new raven.Client(settings.dsn, {
        logger: settings.logger || 'root'
    });
    if (settings.patchGlobal) {
        this.raven.patchGlobal(function(){
            console.log('Uncaught exception occured. Exitting proces...');
            process.exit(1);
        });
    }
    this.raven.on('logged', function(){
        console.log('A message has been logged to Sentry');
    });
    this.raven.on('error', function(e){
        console.log('Sentry error : ');
        console.dir(e);
    })
}

util.inherits(SentryStream, stream.Writable);

SentryStream.prototype._write = function(logMessage, encoding, done) {
    if (typeof logMessage !== 'string' ) {
        try {
            logMessage = JSON.stringify(logMessage);
        } catch (e) {
            logMessage = 'unknonw error';
        }
    }
    this.raven.captureMessage(logMessage);
    done();
};

module.exports = SentryStream;
