const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/lookbook/main.jsx'],
  bundle: true,
  outfile: 'assets/lookbook.js',
  format: 'iife',
  globalName: 'Lookbook',
  jsx: 'automatic',
  loader: { '.jsx': 'jsx' },
  minify: !watch,
  sourcemap: watch,
  target: ['es2020'],
  logLevel: 'info',
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for lookbook changes...');
  } else {
    await esbuild.build(options);
    console.log('Built assets/lookbook.js');
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
