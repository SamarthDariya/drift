const chalk = require('chalk');

// ---------------------------------------------------------------------------
// Build-tool disguise (Vite / bundler dev-server style).
//
// Reads like a running dev server: a stream of HMR updates, module-transform
// progress and chunk-size lines (the decoy noise). REAL chat messages arrive as
// a red "Internal server error" block referencing a source file — build errors
// naturally contain free-form English, and the red block stands out from the
// green/dim build chatter while a passerby just sees a failing compile.
// ---------------------------------------------------------------------------

function rand(n) {
    return Math.floor(Math.random() * n);
}

function hex(n) {
    const c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < n; i++) s += c[rand(c.length)];
    return s;
}

function pick(a) {
    return a[rand(a.length)];
}

function clockTime() {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}:${s} ${ap}`;
}

// Chosen once per session so the banner reads as a stable running server.
const viteVersion = `v5.${rand(6)}.${rand(10)}`;
const port = 5173;

const files = [
    '/src/App.tsx', '/src/main.tsx', '/src/components/Button.tsx',
    '/src/hooks/useAuth.ts', '/src/pages/Home.tsx', '/src/store/index.ts',
    '/src/styles/global.css', '/src/utils/api.ts', '/src/router.tsx'
];

const tag = chalk.cyan('[vite]');
const ts = () => chalk.dim(`${clockTime()} `);

// Decoy line generators, rotated through in order for a coherent stream.
const generators = [
    () => ts() + tag + chalk.green(' hmr update ') + chalk.dim(pick(files)),
    () => ts() + tag + ' page reload ' + chalk.dim(pick(files).slice(1)),
    () => chalk.green('✓') + ` ${180 + rand(120)} modules transformed.`,
    () => chalk.green('✓') + chalk.dim(` built in ${(0.6 + Math.random() * 1.8).toFixed(2)}s`),
    () => {
        const kb = (20 + Math.random() * 180);
        const gz = (kb * 0.32).toFixed(2);
        const br = (kb * 0.27).toFixed(2);
        return chalk.dim(`dist/assets/index-${hex(8)}.js`.padEnd(34)) +
            chalk.cyan(`${kb.toFixed(2)} kB`.padStart(10)) +
            chalk.dim(` │ gzip: ${gz} kB │ brotli: ${br} kB`);
    },
    () => chalk.dim(`transforming (${100 + rand(200)}) ${pick(files).slice(1)}`),
    () => ts() + tag + chalk.dim(' ✨ optimized dependencies changed. reloading'),
    // Compression phase + artifacts (gzip / brotli).
    () => chalk.dim('rendering chunks...'),
    () => chalk.dim('computing gzip size...'),
    () => {
        const kb = (10 + Math.random() * 60).toFixed(2);
        return chalk.dim(`dist/assets/index-${hex(8)}.js.gz`.padEnd(36)) + chalk.cyan(`${kb} kB`.padStart(9));
    },
    () => {
        const kb = (8 + Math.random() * 50).toFixed(2);
        return chalk.dim(`dist/assets/index-${hex(8)}.js.br`.padEnd(36)) + chalk.cyan(`${kb} kB`.padStart(9));
    },
    () => {
        const orig = (80 + Math.random() * 120);
        const gz = (orig * 0.32).toFixed(2);
        return chalk.magenta('[vite-plugin-compression]') +
            chalk.dim(` compressed dist/assets/index-${hex(6)}.js  ${orig.toFixed(2)} kB → ${gz} kB (gzip)`);
    }
];

let idx = rand(generators.length);

function nextGen() {
    const g = generators[idx % generators.length];
    idx = (idx + 1) % generators.length;
    return g;
}

module.exports = {
    name: 'build',
    prompt: '$ ',

    header() {
        return [
            '',
            '  ' + chalk.green.bold(`VITE ${viteVersion}`) + chalk.dim(`  ready in ${200 + rand(300)} ms`),
            '',
            '  ' + chalk.green('➜') + '  ' + chalk.bold('Local:') + chalk.cyan(`   http://localhost:${port}/`),
            '  ' + chalk.green('➜') + '  ' + chalk.bold('Network:') + chalk.dim(' use --host to expose'),
            ''
        ].join('\n');
    },

    // Real chat message → red build error referencing a source file; the chat
    // text is the error message.
    formatMessage(nickname, text) {
        return [
            ts() + tag + chalk.red(' Internal server error: ') + chalk.red(text),
            chalk.dim('    Plugin: vite:import-analysis'),
            chalk.dim(`    File: src/components/${nickname}.tsx:${20 + rand(80)}:${rand(40)}`)
        ].join('\n');
    },

    // Join/leave → HMR client connect / connection-lost, nickname-free.
    formatSystem(text) {
        if (text.includes('joined')) return ts() + tag + chalk.green(' connected.');
        if (text.includes('left')) return ts() + tag + chalk.yellow(' server connection lost. polling for restart...');
        return ts() + tag + ' ' + text;
    },

    formatError(text) {
        return ts() + tag + chalk.red(' build failed: ') + chalk.red(text);
    },

    formatBoot(text) {
        return ts() + tag + ' ' + chalk.dim(text);
    },

    seedLine() {
        return nextGen()();
    }
};
