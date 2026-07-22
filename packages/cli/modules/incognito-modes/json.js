const chalk = require('chalk');

// ---------------------------------------------------------------------------
// JSON structured-log disguise.
//
// Reads like the stdout of a service using structured (JSON-per-line) logging,
// e.g. pino/bunyan. Every line is a JSON object:
//   {"timestamp":"<iso>","level":"info","author":"<component>","log":"<text>"}
//
// - Seed (decoy) lines are only ever info / debug / warn.
// - REAL chat messages are emitted at level "error" and fenced with full-width
//   "===" bars so the user can spot them at a glance amid the noise, while a
//   shoulder-surfer just sees a service that is logging errors.
// ---------------------------------------------------------------------------

function isoTime(ts) {
    const d = ts ? new Date(ts) : new Date();
    return d.toISOString();
}

function jsonLine(level, author, log, ts) {
    return JSON.stringify({ timestamp: isoTime(ts), level, author, log });
}

function colorByLevel(line, level) {
    if (level === 'error') return chalk.red(line);
    if (level === 'warn') return chalk.yellow(line);
    if (level === 'debug') return chalk.gray(line);
    return line; // info: default terminal color, looks natural
}

function fullWidthBar() {
    const cols = process.stdout.columns || 80;
    return '='.repeat(cols);
}

// A rotating stream of plausible service logs. Component names double as the
// "author" field so the stream reads like several subsystems interleaving.
const seedEntries = [
    { author: 'http.server',    level: 'info',  log: 'request completed method=GET path=/api/health status=200 duration=3ms' },
    { author: 'http.server',    level: 'info',  log: 'request completed method=POST path=/api/users status=201 duration=41ms' },
    { author: 'db.pool',        level: 'debug', log: 'connection acquired pool=primary active=4 idle=6' },
    { author: 'db.pool',        level: 'warn',  log: 'connection checkout slow pool=primary waited=812ms' },
    { author: 'cache.redis',    level: 'debug', log: 'cache hit key=session:8f21a ttl=286s' },
    { author: 'cache.redis',    level: 'info',  log: 'cache miss key=user:9281 fetching from origin' },
    { author: 'auth.jwt',       level: 'info',  log: 'token issued sub=svc-worker exp=3600s' },
    { author: 'auth.jwt',       level: 'warn',  log: 'token nearing expiry sub=svc-worker remaining=58s' },
    { author: 'queue.consumer', level: 'info',  log: 'message processed topic=events partition=2 offset=48213' },
    { author: 'queue.consumer', level: 'warn',  log: 'consumer lag detected topic=events lag=1204' },
    { author: 'scheduler',      level: 'debug', log: 'tick job=compaction next=30s' },
    { author: 'scheduler',      level: 'info',  log: 'job started name=nightly-backup id=bk-4821' },
    { author: 'net.gateway',    level: 'info',  log: 'upstream healthy target=10.0.1.14:8080 latency=6ms' },
    { author: 'net.gateway',    level: 'warn',  log: 'upstream timeout target=10.0.1.22:8080 retry=1/3' },
    { author: 'gc',             level: 'debug', log: 'gc pause type=minor duration=12ms freed=4.1MB' },
    { author: 'metrics',        level: 'info',  log: 'flush complete points=2048 sink=prometheus' },
    { author: 'worker.pool',    level: 'debug', log: 'task dequeued id=t-90213 workers=8 busy=3' },
    { author: 'tls',            level: 'info',  log: 'certificate renewed cn=api.internal expires=90d' },
    { author: 'health',         level: 'info',  log: 'liveness probe ok checks=6 failed=0' },
    { author: 'ratelimit',      level: 'debug', log: 'bucket refill client=10.0.2.5 tokens=100' }
];

// Rotate sequentially so the stream reads like an ordered service log, starting
// at a random offset so two sessions don't look identical.
let seedIndex = Math.floor(Math.random() * seedEntries.length);

function nextSeed() {
    const entry = seedEntries[seedIndex % seedEntries.length];
    seedIndex = (seedIndex + 1) % seedEntries.length;
    return entry;
}

module.exports = {
    name: 'json',
    prompt: '$ ',

    // Real chat message → level "error", fenced with full-width bars so it
    // stands out from the info/debug/warn decoy noise.
    formatMessage(nickname, text, timestamp) {
        const bar = chalk.red(fullWidthBar());
        const line = chalk.red.bold(jsonLine('error', nickname, text, timestamp));
        return `${bar}\n${line}\n${bar}`;
    },

    // Join/leave → nickname-free, blends in as an ordinary info line.
    formatSystem(text) {
        let log = text;
        if (text.includes('joined')) log = 'peer connected';
        else if (text.includes('left')) log = 'peer disconnected';
        return jsonLine('info', 'net.pool', log);
    },

    formatError(text) {
        return chalk.red(jsonLine('error', 'net.gateway', text));
    },

    formatBoot(text) {
        return jsonLine('info', 'boot', text);
    },

    seedLine() {
        const e = nextSeed();
        return colorByLevel(jsonLine(e.level, e.author, e.log), e.level);
    }
};
