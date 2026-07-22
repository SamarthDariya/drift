const chalk = require('chalk');

// ---------------------------------------------------------------------------
// CI pipeline disguise (GitHub Actions / Jenkins style).
//
// Reads like a build pipeline streaming its steps: a run of green "✓ step"
// lines (the decoy noise) with the occasional running spinner. REAL chat
// messages arrive as a red "✗ Run integration tests" failure block whose
// `Error:` line carries the message — CI failures naturally contain free-form
// English, and red-against-green makes it pop for the reader while a passerby
// just sees a failing build.
// ---------------------------------------------------------------------------

function rand(n) {
    return Math.floor(Math.random() * n);
}

function hex(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += rand(16).toString(16);
    return s;
}

// Chosen once per session so the run looks stable across the screen.
const pipelines = ['build-and-test', 'ci', 'release', 'lint-and-build'];
const branches = ['main', 'develop', 'feat/api-v2', 'fix/flaky-tests', 'chore/deps'];
const pipeline = pipelines[rand(pipelines.length)];
const branch = branches[rand(branches.length)];
const runNumber = 4800 + rand(400);

// Decoy step pool. `detail` is a thunk so numbers vary line-to-line.
const steps = [
    { step: 'Set up job',           min: 0.5, max: 1.5,  detail: () => '' },
    { step: 'Checkout repository',  min: 0.4, max: 1.2,  detail: () => '' },
    { step: 'Setup Node 20.x',      min: 2.0, max: 4.5,  detail: () => '' },
    { step: 'Cache node_modules',   min: 0.3, max: 1.0,  detail: () => `cache hit: linux-node-${hex(5)}` },
    { step: 'Install dependencies', min: 8.0, max: 20.0, detail: () => `added ${180 + rand(80)} packages` },
    { step: 'Lint',                 min: 1.0, max: 3.0,  detail: () => '0 errors, 0 warnings' },
    { step: 'Type-check',           min: 3.0, max: 7.0,  detail: () => 'tsc --noEmit' },
    { step: 'Run unit tests',       min: 6.0, max: 15.0, detail: () => `${120 + rand(200)} passed` },
    { step: 'Upload coverage',      min: 1.0, max: 3.0,  detail: () => `codecov ${(85 + Math.random() * 13).toFixed(1)}%` },
    { step: 'Build artifacts',      min: 4.0, max: 10.0, detail: () => `dist/ ${(2 + Math.random() * 5).toFixed(1)} MB` },
    { step: 'Audit dependencies',   min: 1.0, max: 3.0,  detail: () => '0 vulnerabilities' },
    { step: 'Docker build',         min: 10.0, max: 30.0, detail: () => `image ${hex(6)}` },
    { step: 'Push image',           min: 3.0, max: 8.0,  detail: () => 'registry.internal' },
    { step: 'Deploy preview',       min: 4.0, max: 9.0,  detail: () => `https://pr-${rand(400)}.preview.app` }
];

// Rotate sequentially from a random offset so the stream reads like an ordered
// pipeline rather than random jumps.
let stepIndex = rand(steps.length);

function nextStep() {
    const s = steps[stepIndex % steps.length];
    stepIndex = (stepIndex + 1) % steps.length;
    return s;
}

function stepLine(s) {
    const t = (s.min + Math.random() * (s.max - s.min)).toFixed(1);
    const detail = s.detail();
    const detailStr = detail ? chalk.dim('  ' + detail) : '';
    return chalk.green('  ✓ ') + chalk.white(s.step.padEnd(24)) + detailStr + chalk.dim(`  ${t}s`);
}

module.exports = {
    name: 'ci',
    prompt: '$ ',

    header() {
        const cols = process.stdout.columns || 80;
        const left = `● CI · ${pipeline} · #${runNumber}`;
        const pad = Math.max(1, cols - left.length - branch.length - 2);
        return chalk.bold(left) + ' '.repeat(pad) + chalk.dim(branch);
    },

    // Real chat message → failed integration-test block; text on the Error line.
    formatMessage(nickname, text) {
        const t = (Math.random() * 4 + 1).toFixed(1);
        return [
            chalk.red('  ✗ Run integration tests') + chalk.dim(`  ${t}s`),
            chalk.red(`      Error: ${text}`),
            chalk.dim(`      at ${nickname} (tests/e2e/flow.spec.ts:${20 + rand(80)}:11)`),
            chalk.dim('      Exit code 1')
        ].join('\n');
    },

    // Join/leave → nickname-free runner lifecycle line.
    formatSystem(text) {
        let msg = text;
        if (text.includes('joined')) msg = 'Runner registered';
        else if (text.includes('left')) msg = 'Runner deregistered';
        return chalk.green('  ✓ ') + chalk.white(msg);
    },

    formatError(text) {
        return chalk.red(`  ✗ Workflow failed  ${text}`);
    },

    formatBoot(text) {
        return chalk.cyan('  ● ') + text;
    },

    seedLine() {
        // Occasionally show an in-progress step for a live feel.
        if (Math.random() < 0.18) {
            const s = steps[rand(steps.length)];
            return chalk.yellow('  ⠹ ') + chalk.white(s.step) + chalk.dim(' …');
        }
        return stepLine(nextStep());
    }
};
