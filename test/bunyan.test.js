const tap = require('tap');

tap.test('bunyan', (t) => {
    const UtLog = require('../index');
    t.ok(UtLog, 'Require ut-log');
    const utLogConfig = {
        type: 'bunyan',
        workDir: __dirname,
        streams: [
            {
                level: 'trace',
                stream: 'process.stdout'
            }
        ]
    };
    const logFactory = new UtLog(utLogConfig);
    t.ok(logFactory, 'Create log factory');
    const logger = logFactory.createLog('error', {name: 'test name', context: 'test context'});
    t.ok(logger, 'Create logger');
    t.end();
});
