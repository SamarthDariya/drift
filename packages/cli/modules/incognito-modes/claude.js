const chalk = require('chalk');

// ---------------------------------------------------------------------------
// Claude Code disguise.
//
// Reads like an AI coding agent working in a repo: a stream of tool calls
// (Read / Search / Bash / Update) with dim result lines, "Thinking…" notes and
// a status spinner make up the decoy noise. REAL chat messages arrive as a
// code edit — an "Update" diff whose added line is a comment "+  // name: text"
// — so at a glance it's just code being written to a file, while the sender's
// name is preserved. Seeds emit Update() calls too, but never with a visible
// `+` diff line, so this stays the shape you can pick out.
// ---------------------------------------------------------------------------

function rand(n) {
    return Math.floor(Math.random() * n);
}

function pick(a) {
    return a[rand(a.length)];
}

const cwd = '~/projects/drift';
const version = `v2.0.${rand(60)}`;

const files = [
    'packages/cli/cli.js', 'src/server.js', 'packages/cli/modules/display.js',
    'README.md', 'src/routes/api.ts', 'lib/utils.js',
    'test/e2e/flow.spec.ts', 'src/components/App.tsx', 'src/hooks/useAuth.ts'
];
const dirs = ['packages/cli/modules', 'src', 'test', 'public', 'src/components'];
const cmds = ['npm test', 'npm run build', 'git status', 'node server.js', 'npm run lint', 'git diff --stat'];
const patterns = ['TODO|FIXME', 'function.*async', 'console\\.log', 'import .* from', 'useState'];
const words = [
    'Herding', 'Pondering', 'Noodling', 'Percolating', 'Conjuring', 'Finagling',
    'Simmering', 'Cogitating', 'Vibing', 'Wrangling', 'Marinating', 'Ruminating'
];

const dot = chalk.green('⏺');
const res = (text) => chalk.dim(`  ⎿  ${text}`);

// Decoy generators — each returns a full (possibly multi-line) tool interaction.
const generators = [
    () => `${dot} ${chalk.bold('Read')}(${chalk.dim(pick(files))})\n` + res(`Read ${20 + rand(300)} lines`),
    () => `${dot} ${chalk.bold('Search')}(${chalk.dim(`pattern: "${pick(patterns)}"`)})\n` + res(`Found ${1 + rand(40)} matches across ${1 + rand(12)} files`),
    () => `${dot} ${chalk.bold('Bash')}(${chalk.dim(pick(cmds))})\n` + res('Running…'),
    () => `${dot} ${chalk.bold('Update')}(${chalk.dim(pick(files))})\n` + res(`Updated with ${1 + rand(9)} additions and ${rand(5)} removals`),
    () => `${dot} ${chalk.bold('List')}(${chalk.dim(pick(dirs))})\n` + res(`${3 + rand(40)} files`),
    () => `${dot} ${chalk.bold('Glob')}(${chalk.dim('**/*.js')})\n` + res(`${5 + rand(80)} paths`),
    () => chalk.dim('✻ Thinking…'),
    () => chalk.dim(`✶ ${pick(words)}… (${1 + rand(30)}s · ↑ ${(0.3 + Math.random() * 4).toFixed(1)}k tokens · esc to interrupt)`)
];

let idx = rand(generators.length);

function nextGen() {
    const g = generators[idx % generators.length];
    idx = (idx + 1) % generators.length;
    return g;
}

module.exports = {
    name: 'claude',
    prompt: '$ ',

    header() {
        return chalk.bold(' ▐ Claude Code') + chalk.dim(`  ${version}`) + chalk.dim(`   ${cwd}`);
    },

    // Real chat message → a code edit ("Update" diff). The message rides in as
    // an added comment line (`+  // name: text`), so at a glance it's just code
    // being written to a file — comments hold arbitrary English naturally, and
    // the sender's name is preserved. Seeds emit Update() calls too, but never
    // with a visible `+` diff line, so this stays the shape you can pick out.
    formatMessage(nickname, text) {
        const line = 20 + rand(200);
        return `${dot} ${chalk.bold('Update')}(${chalk.dim(pick(files))})\n` +
            chalk.dim('  ⎿  Updated with 1 addition\n') +
            chalk.dim(`       ${line} `) + chalk.green(`+  // ${nickname}: ${text}`);
    },

    // Join/leave → nickname-free session lifecycle line.
    formatSystem(text) {
        if (text.includes('joined')) return chalk.dim('· resumed session');
        if (text.includes('left')) return chalk.dim('· session ended');
        return chalk.dim(`· ${text}`);
    },

    formatError(text) {
        return `  ⎿  ${chalk.red(`Error: ${text}`)}`;
    },

    formatBoot(text) {
        return dot + chalk.dim(` ${text}`);
    },

    seedLine() {
        return nextGen()();
    }
};
