const fs = require('fs');
const os = require('os');
const path = require('path');

// Persistent user config, stored at ~/.config/drift/config.json.
// Currently just remembers the preferred default incognito mode.
const CONFIG_DIR = path.join(os.homedir(), '.config', 'drift');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        return {}; // missing or unreadable/corrupt → treat as empty
    }
}

function writeConfig(config) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

function getDefaultMode() {
    return readConfig().incognitoMode || null;
}

function setDefaultMode(mode) {
    const config = readConfig();
    config.incognitoMode = mode;
    writeConfig(config);
    return CONFIG_FILE;
}

module.exports = { CONFIG_FILE, readConfig, getDefaultMode, setDefaultMode };
