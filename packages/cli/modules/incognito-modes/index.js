const htop = require('./htop');
const syslog = require('./syslog');
const json = require('./json');

const modes = { htop, syslog, json };

function getMode(name) {
    return modes[name] || modes.htop;
}

module.exports = { modes, getMode };
