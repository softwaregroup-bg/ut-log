const fs = require('fs-plus');
const path = require('path');

module.exports = {
    createLogDir: function(workDir) {
        const logDir = path.join(workDir, 'ut-log');
        try {
            fs.accessSync(logDir, fs.R_OK | fs.W_OK);
        } catch (e) {
            if (e.code === 'ENOENT') {
                try {
                    fs.makeTreeSync(logDir);
                } catch (e) {
                    if (e.code !== 'EEXIST') {
                        throw e;
                    }
                }
            } else {
                throw e;
            }
        }
        return logDir;
    }
};
