const htop = require('./htop');
const syslog = require('./syslog');
const json = require('./json');
const ci = require('./ci');

const modes = { htop, syslog, json, ci };

function getMode(name) {
    return modes[name] || modes.htop;
}

module.exports = { modes, getMode };
