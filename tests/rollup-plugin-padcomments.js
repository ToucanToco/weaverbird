const { createFilter } = require('rollup-pluginutils');

function padWithComments(options = {}) {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'rollup-plugin-padcomments',
    transform(code, id) {
      if (!filter(id)) {
        return;
      }
      console.log('>'.repeat(80), 'before');
      console.log(code);
      console.log('<'.repeat(80));
      code = code.replace(/^\s*?\n/gm, '// keep me\n');
      console.log('>'.repeat(80), 'after');
      console.log(code);
      console.log('<'.repeat(80));
      return {
        code,
        map: { mappings: '' },
      }
    }
  };
}

module.exports = padWithComments;
