const htop = require('./htop');
const syslog = require('./syslog');
const json = require('./json');
const ci = require('./ci');
const build = require('./build');

const modes = { htop, syslog, json, ci, build };

function getMode(name) {
    return modes[name] || modes.htop;
}

module.exports = { modes, getMode };
