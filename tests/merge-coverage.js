const fs = require('fs');

const SPLIT_SCRIPT_SUFFIX = /\.vue\?rollup-plugin-vue=script\.(ts|js)$/;


function mergeVueCoverage(tmplCov, tsCov) {
  // handle statements
  if (tmplCov.statementMap !== undefined) {
    if (tmplCov.s === undefined) {
      tmplCov.s = {};
    }
    const stmtOffset = Object.keys(tmplCov.statementMap).length;
    for (const [key, value] of Object.entries(tsCov.statementMap)) {
      const newKey = Number(key) + stmtOffset;
      tmplCov.statementMap[newKey] = value;
      if (tsCov.s && tsCov.s[key] !== undefined) {
        tmplCov.s[newKey] = tsCov.s[key];
      }
    }
  } else if (tsCov.statementMap !== undefined) {
    tmplCov.statementMap = tsCov.statementMap;
    tmplCov.s = tsCov.s;
  }
  // handle functions
  if (tmplCov.fnMap !== undefined) {
    if (tmplCov.f === undefined) {
      tmplCov.f = {};
    }
    const stmtOffset = Object.keys(tmplCov.fnMap).length;
    for (const [key, value] of Object.entries(tsCov.fnMap)) {
      const newKey = Number(key) + stmtOffset;
      tmplCov.fnMap[newKey] = value;
      if (tsCov.f && tsCov.f[key] !== undefined) {
        tmplCov.f[newKey] = tsCov.f[key];
      }
    }
  } else if (tsCov.fnMap !== undefined) {
    tmplCov.fnMap = tsCov.fnMap;
    tmplCov.f = tsCov.f;
  }
  // handle branches
  if (tmplCov.branchMap !== undefined) {
    if (tmplCov.b === undefined) {
      tmplCov.b = {};
    }
    const stmtOffset = Object.keys(tmplCov.branchMap).length;
    for (const [key, value] of Object.entries(tsCov.branchMap)) {
      const newKey = Number(key) + stmtOffset;
      tmplCov.branchMap[newKey] = value;
      if (tsCov.b && tsCov.b[key] !== undefined) {
        tmplCov.b[newKey] = tsCov.b[key];
      }
    }
  } else if (tsCov.branchMap !== undefined) {
    tmplCov.branchMap = tsCov.branchMap;
    tmplCov.b = tsCov.b;
  }
}

function processCoverage(filepath) {
  const data = JSON.parse(fs.readFileSync(filepath));
  const newData = {};
  const buf = [];
  for (const [path, covdata] of Object.entries(data)) {
    console.log('processing', path)
    if (SPLIT_SCRIPT_SUFFIX.test(path)) {
      continue;
    }
    if (path.endsWith('.vue')) {
      const tscov = data[`${path}?rollup-plugin-vue=script.ts`];
      if (tscov !== undefined) {
        mergeVueCoverage(covdata, tscov);
      } else {
        const jscov = data[`${path}?rollup-plugin-vue=script.js`];
        if (jscov !== undefined) {
          mergeVueCoverage(covdata, jscov);
        }
      }
    }
    newData[path] = covdata;
    buf.push(`"${path}": ${JSON.stringify(covdata)}`);
  }
  const outputPath = `${filepath.slice(0, -5)}-merged.json`;
  // fs.writeFileSync(outputPath, JSON.stringify(newData));
  fs.writeFileSync(outputPath, `{\n${buf.join(',\n')}\n}`);
}

processCoverage(process.argv[2]);
