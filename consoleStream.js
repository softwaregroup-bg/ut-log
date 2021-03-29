// https://github.com/philmander/browser-bunyan/blob/master/LICENSE
// some improvements on browser-bunyan

const TRACE = 10;
const DEBUG = 20;
const INFO = 30;
const WARN = 40;
const ERROR = 50;
const FATAL = 60;

const levelFromName = {
    trace: TRACE,
    debug: DEBUG,
    info: INFO,
    warn: WARN,
    error: ERROR,
    fatal: FATAL
};

const nameFromLevel = {};
Object.keys(levelFromName).forEach(name => {
    nameFromLevel[levelFromName[name]] = name;
});

const DEFAULT_CSS = {
    levels: {
        trace: 'color: grey',
        debug: 'color: blue',
        info: 'color: cyan',
        warn: 'color: magenta',
        error: 'color: red',
        fatal: 'color: red; font-weight:bold'
    },
    def: 'color: black',
    msg: 'color: darkblue',
    service: 'color: darkorange',
    mtid: 'color: Magenta',
    src: 'color: DimGray; font-style: italic; font-size: 0.9em'
};

const skip = ['name', 'hostname', 'pid', 'level', 'component', 'msg', 'time', 'v', 'src', 'error', 'clientReq',
    'clientRes', 'req', 'res', '$meta', 'mtid', 'jsException', 'service'];

class ConsoleFormattedStream {
    constructor({ logByLevel = false, css = DEFAULT_CSS } = {}) {
        this.logByLevel = logByLevel;
        this.css = css;
    }

    write(rec) {
        let levelCss, consoleMethod;
        const defaultCss = this.css.def;
        const msgCss = this.css.msg;
        const srcCss = this.css.src;

        const loggerName = rec.childName ? rec.name + '/' + rec.childName : rec.name;

        // get level name and pad start with spacs
        let levelName = nameFromLevel[rec.level];
        const formattedLevelName = (Array(6 - levelName.length).join(' ') + levelName).toUpperCase();

        if (this.logByLevel) {
            if (rec.level === TRACE) {
                levelName = 'debug';
            } else if (rec.level === FATAL) {
                levelName = 'error';
            }
            consoleMethod = typeof console[levelName] === 'function' ? console[levelName] : console.log; // eslint-disable-line
        } else {
            consoleMethod = console.log; // eslint-disable-line
        }

        if (rec.level < DEBUG) {
            levelCss = this.css.levels.trace;
        } else if (rec.level < INFO) {
            levelCss = this.css.levels.debug;
        } else if (rec.level < WARN) {
            levelCss = this.css.levels.info;
        } else if (rec.level < ERROR) {
            levelCss = this.css.levels.warn;
        } else if (rec.level < FATAL) {
            levelCss = this.css.levels.error;
        } else {
            levelCss = this.css.levels.fatal;
        }

        let details = Object.entries(rec)
            .filter(entry => entry[1] != null && !skip.includes(entry[0]))
            .reduce((prev, [name, value]) => {
                prev[name] = value;
                return prev;
            }, {});
        if (Object.keys(details).length === 0) details = false;

        const logArgs = [];
        logArgs.push(`[%s] %c%s%c %s%c %s: %c%s %c%s ${details ? '%c%o' : ''} ${rec.src ? '%c%s' : ''}`);
        logArgs.push(rec.time.toISOString().substr(11, 12));
        logArgs.push(levelCss);
        logArgs.push(formattedLevelName);
        logArgs.push(this.css.service);
        logArgs.push(rec.service);
        logArgs.push(defaultCss);
        logArgs.push(loggerName);
        logArgs.push(this.css.mtid);
        logArgs.push(rec.mtid || '');
        logArgs.push(msgCss);
        logArgs.push((rec.$meta && (rec.$meta.method || rec.$meta.opcode)) || rec.msg);
        if (details) {
            logArgs.push(srcCss);
            logArgs.push(details);
        }
        if (rec.src) {
            logArgs.push(srcCss);
            logArgs.push(rec.src);
        }

        consoleMethod.apply(console, logArgs);
        if (rec.error && rec.error.stack) console.error(rec.error); // eslint-disable-line
        if (rec.obj) {
            consoleMethod.call(console, rec.obj);
        }
    }

    static getDefaultCss() {
        return DEFAULT_CSS;
    }
}

module.exports = function(config) {
    return new ConsoleFormattedStream(config);
};
