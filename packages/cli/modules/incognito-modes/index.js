const htop = require('./htop');
const syslog = require('./syslog');
const json = require('./json');
const ci = require('./ci');
const claude = require('./claude');
const build = require('./build');

const modes = { htop, syslog, json, ci, build, claude };

function getMode(name) {
    return modes[name] || modes.htop;
}

module.exports = { modes, getMode };
