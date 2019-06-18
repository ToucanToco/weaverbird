/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');


const pkgpath = path.join(__dirname, '..', '..');
const entrypoint = path.join(__dirname, 'entrypoint.js');
const outputfile = path.join(pkgpath, 'src/mathjs_bundle.js');


function bundeUpToDate() {
  return (
    fs.existsSync(outputfile) &&
    fs.statSync(outputfile).mtime > fs.statSync(entrypoint).mtime
  );
}

async function build() {
  // create a bundle
  const bundle = await rollup.rollup({
    input: entrypoint,
    plugins: [
      resolve(),
      commonjs({
        include: [
          path.join(pkgpath, 'node_modules/typed-function/typed-function.js'),
          path.join(pkgpath, 'node_modules/complex.js/complex.js'),
          path.join(pkgpath, 'node_modules/fraction.js/fraction.js'),
          path.join(pkgpath, 'node_modules/javascript-natural-sort/naturalSort.js'),
          path.join(pkgpath, 'node_modules/escape-latex/dist/index.js'),
          path.join(pkgpath, 'node_modules/seed-random/index.js'),
          path.join(pkgpath, 'node_modules/tiny-emitter/index.js'),
        ]
      }),
    ],
  });
  const outputOptions = {
    file: outputfile,
    format: 'esm',

  };
  // generate code
  await bundle.generate(outputOptions);
  // or write the bundle to disk
  await bundle.write(outputOptions);
}

if (!bundeUpToDate()) {
  build();
}
