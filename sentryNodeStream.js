/* eslint no-console:0 */
const stream = require('readable-stream');
const util = require('util');
const Sentry = require('@sentry/node');

// config.dsn (string) mandatory
// config.patchGlobal (boolean) optional (dafault: false) - if global exceptions should be handled
function SentryStream(config, loggerOptions) {
    stream.Writable.call(this, {objectMode: true});
    try {
        Sentry.init({
            ...config,
            ...{
                environment: loggerOptions.env,
                release: loggerOptions.version,
                serverName: require('os').hostname()
            },
            ...{
                integrations: (integrations) => { // integrations will be all default integrations
                    return config.patchGlobal ? integrations : integrations.filter(integration => ['OnUncaughtException', 'OnUnhandledRejection'].includes(integration.name));
                }
            }
        });

        // todo log sentry errors

        this.sentryClient = true;
    } catch (e) {
        console.error(e);
        this.sentryClient = null;
    }
}

util.inherits(SentryStream, stream.Writable);

SentryStream.prototype._write = function(logMessage, encoding, done) {
    if (this.sentryClient) {
        Sentry.withScope(scope => {
            scope.setTag('context', logMessage.context);
            scope.setTag('service', logMessage.service);
            logMessage.error && logMessage.error.type && scope.setTag('type', logMessage.error.type);
            if (logMessage.jsException) {
                scope.setTag('method', logMessage.jsException.method);
                Sentry.captureException(logMessage.jsException);
            } else {
                Sentry.captureMessage(logMessage);
            }
        });
    }
    done();
};

SentryStream.prototype._destroy = function(error, callback) {
    Sentry.close();
    callback(error);
};

module.exports = function(config, loggerOptions) {
    return new SentryStream(config, loggerOptions);
};
