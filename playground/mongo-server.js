/* eslint-disable @typescript-eslint/no-var-requires */
const tmp = require('tmp');
const { MongodHelper } = require('mongodb-prebuilt');

tmp.setGracefulCleanup(); // required to be able to remove directory correctly

/**
 * try to extract port number for specified dburi
 *
 * @param dburi e.g. `mongodb://localhost:27017
 * @return null if no port number could be guessed.
 */
function portFromuri(dburi) {
  const match = /mongodb:\/\/(.*):(\d+)\/?/.exec(dburi);
  if (match === null) {
    return null;
  }
  return match[2];
}

async function startMongo({ dburi = 'mongodb://localhost:27017', version = '3.6.12' } = {}) {
  const port = portFromuri(dburi);
  if (port === null) {
    throw new Error(
      `Can't guess port number from uri ${dburi}, expected something like mongodb://me@localhost:27017`,
    );
  }
  // `unsafeCleanup` to tell `tmp.js` to use `rimraf` and allow deleting
  // non-empty temporary directory.
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });
  const mongodHelper = new MongodHelper(
    ['--port', port.toString(), '--dbpath', tmpdir.name, '--storageEngine', 'ephemeralForTest'],
    {
      version,
    },
  );
  try {
    return {
      started: await mongodHelper.run(),
      tmpdir,
    };
  } catch (err) {
    console.error(`Got error ${err}`);
    tmpdir.removeCallback();
    return {
      started: false,
      tmpdir,
    };
  }
}

module.exports = {
  startMongo,
};
