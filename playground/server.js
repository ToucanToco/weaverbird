/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('fs');
const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const csv = require('csvtojson');
const multer = require('multer');
const { startMongo } = require('./mongo-server');

const meow = require('meow');
const upload = multer();

function _loadData(data, config, client, onsuccess, onerror, collname = null) {
  client.connect(function(err) {
    assertIsConnected(client, err);
    const db = client.db(config.dbname);
    collname = collname || config.defaultCollection;
    const collection = db.collection(collname);
    collection.deleteMany({}, function(err) {
      if (err) {
        onerror(err);
      } else {
        collection.insertMany(data, function(err) {
          if (err) {
            onerror(err);
          } else {
            onsuccess({
              collection: collname,
            });
          }
        });
      }
    });
  });
}

/**
 *
 * @param filepath path to CSV file
 * @param config database config
 * @param client mongo client
 * @param onsuccess callback to call on success
 * @param onerror callback to call on error
 */
function loadCSVInDatabaseFromFile(filepath, config, client, onsuccess, onerror) {
  csv({ checkType: true })
    .fromFile(filepath)
    .then(data => _loadData(data, config, client, onsuccess, onerror));
}

function loadCSVInDatabase(data, collname, config, client, onsuccess, onerror) {
  csv({
    checkType: true,
    ignoreEmpty: true,
    output: 'json',
  })
    .fromString(data)
    .then(data => _loadData(data, config, client, onsuccess, onerror, collname));
}

/**
 * assert client is actually connected to a mongo backend and crash otherwise.
 *
 * @param client mongo client
 * @param err mongo error, if any
 */
function assertIsConnected(client, err) {
  if (err || !client.isConnected()) {
    let msg = 'Failed to connect to database';
    if (err) {
      msg += `becase ${err}`;
    }
    throw new Error(msg);
  }
}

/**
 * Transform an aggregation query into a `$facet` one so that we can get in a single
 * query both total query conut (independently of `$limit` or `$skip` operators) and
 * the query results.
 *
 * @param {Array} query the initial aggregation query
 * @return the transformed `$facet` query
 */
function facetize(query) {
  if (!query.length) {
    query.push({ $match: {} })
  }
  return [
    {
      $facet: {
        stage1: [{
          $group: {
            _id: null, count: { $sum: 1 }
          }
        }],
        stage2: query,
      }
    },

    { $unwind: '$stage1' },

    //output projection
    {
      $project: {
        count: '$stage1.count',
        data: '$stage2'
      }
    }
  ];
}

/**
 * execute `query` on `collectionName` inside the mongodatabase
 *
 * @param config database config
 * @param client mongo client
 * @param collectionName the name of the collection to query
 * @param query the mongo query
 * @param onsuccess callback to call on success with results
 * @param onerror callback to call on error
 */
function executeQuery(config, client, collectionName, query, onsuccess, onerror) {
  client.connect(function(err) {
    assertIsConnected(client, err);
    const db = client.db(config.dbname);
    const collection = db.collection(collectionName);
    try {
      collection.aggregate(facetize(query)).toArray(function(err, docs) {
        if (err) {
          onerror(err);
        } else {
          onsuccess(docs);
        }
      });
    } catch (err) {
      onerror(err);
    }
  });
}

/**
 * list collections in mongo database
 *
 * @param config database config
 * @param client mongo client
 * @param onsuccess callback to call on success with the list of collections
 * @param onerror callback to call on error
 */
function listCollections(config, client, onsuccess, onerror) {
  client.connect(function(err) {
    assertIsConnected(client, err);
    const db = client.db(config.dbname);
    db.listCollections().toArray((err, results) => {
      if (err) {
        onerror(err);
      } else {
        onsuccess(results.map(collectionInfos => collectionInfos.name).sort());
      }
    });
  });
}

function _testConnection(client) {
  client.connect(function() {});
}

function setupApp(config) {
  const client = new MongoClient(config.dburi, { useNewUrlParser: true });
  _testConnection(client);
  if (config.reset) {
    loadCSVInDatabaseFromFile(config.defaultDataset, config, client, console.error);
  }
  const app = express();

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  app.use(bodyParser.json());

  app.post('/query', (req, res) => {
    executeQuery(
      config,
      client,
      req.body.collection,
      req.body.query,
      res.json.bind(res),
      console.error,
    );
  });

  app.post('/load', upload.single('file'), (req, res) => {
    const csvString = req.file.buffer.toString('utf8');
    const newConfig = { ...config };
    loadCSVInDatabase(
      csvString,
      req.file.filename || req.file.originalname,
      newConfig,
      client,
      res.json.bind(res),
      console.error,
    );
  });

  app.get('/collections', (req, res) => {
    listCollections(config, client, res.json.bind(res), console.error);
  });

  app.use(express.static(__dirname + '/dist'));
  return app;
}

function parseCommandLine() {
  const cli = meow(
    `
  Usage
    $ node server.js [options]

  where options are:
    --configfile         path to configuration file,
                         default is ${__dirname}/playground.config.json

    --dburi               override "dburi" option from config file,
                          default is "mongodb://localhost:27107"

    --dbname              override "dbname" option from config file,
                          default is "playground-db"

    --defaultCollection   override "defaultCollection" option from config file,
                          default is "test-collection"

    --reset               reset default collection, override "reset" option from config file,
                          default is false

    --automongo           download (only the first time) and execute a local, ephemeral,
                          mongo server. If present, "--dburi" is ignored.

    --defaultDataset      path to dataset to load in database
                          default is ${__dirname}/default-dataset.csv

    --httpPort / -p       override "httpPort" option from config file,
                          default is 3000
  `,
    {
      flags: {
        configfile: {
          type: 'string',
          alias: 'c',
          default: `${__dirname}/playground.config.json`,
        },
        dburi: {
          type: 'string',
          default: null,
        },
        dbname: {
          type: 'string',
          default: null,
        },
        httpPort: {
          type: 'string',
          alias: 'p',
          default: null,
        },
        defaultCollection: {
          type: 'string',
          alias: 'C',
          default: null,
        },
        reset: {
          type: 'boolean',
          default: false,
        },
        automongo: {
          type: 'boolean',
          default: false,
        },
        defaultDataset: {
          type: 'string',
          alias: 'D',
          default: `${__dirname}/default-dataset.csv`,
        },
      },
    },
  );
  const config = {
    ...JSON.parse(readFileSync(cli.flags.configfile).toString()),
  };
  for (const opt of [
    'dburi',
    'dbname',
    'httpPort',
    'dburi',
    'defaultCollection',
    'reset',
    'automongo',
    'defaultDataset',
  ]) {
    const envVar = `VQB_PLAYGROUND_${opt.toUpperCase()}`;
    if (cli.flags[opt]) {
      config[opt] = cli.flags[opt];
    } else if (process.env[envVar]) {
      config[opt] = process.env[envVar];
    }
  }
  return config;
}

function start(config) {
  setupApp(config).listen(config.httpPort, function() {
    console.log(`VQB playground app listening on port ${config.httpPort}!`);
  });
}

const config = parseCommandLine();
if (config.automongo) {
  startMongo(config).then(({ tmpdir }) => {
    process.on('exit', () => {
      tmpdir.removeCallback();
    });
    start(config);
  });
} else {
  start(config);
}
