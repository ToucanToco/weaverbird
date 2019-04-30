import { readFileSync, readFile } from 'fs';
import express = require('express');
import { MongoClient, MongoError } from 'mongodb';
import bodyParser from 'body-parser';

import meow from 'meow';

type ServerConfig = {
  dburi: string;
  dbname: string;
  port: number;
};

/**
 * assert client is actually connected to a mongo backend and crash otherwise.
 *
 * @param client mongo client
 * @param err mongo error, if any
 */
function assertIsConnected(client: MongoClient, err: MongoError) {
  if (err || !client.isConnected()) {
    let msg = 'Failed to connect to database';
    if (err) {
      msg += `becase ${err}`;
    }
    throw new Error(msg);
  }
}

/**
 * execute `query` on `collectionName` inside the mongodatabase
 *
 * @param config database config
 * @param client mongo client
 * @param collectionName the name of the collection to query
 * @param query the mongo query
 * @param onsuccess callback to call on success with results
 * @param onerrror callback to call on error
 */
function executeQuery(
  config: ServerConfig,
  client: MongoClient,
  collectionName: string,
  query: Array<object>,
  onsuccess: (results: object) => void,
  onerrror: (err: any) => void,
) {
  client.connect(function(err) {
    assertIsConnected(client, err);
    const db = client.db(config.dbname);
    const collection = db.collection(collectionName);
    collection.aggregate(query).toArray(function(err, docs) {
      if (err) {
        onerrror(err);
      } else {
        onsuccess(docs);
      }
    });
  });
}

/**
 * list collections in mongo database
 *
 * @param config database config
 * @param client mongo client
 * @param onsuccess callback to call on success with the list of collections
 * @param onerrror callback to call on error
 */
function listCollections(
  config: ServerConfig,
  client: MongoClient,
  onsuccess: (results: Array<string>) => void,
  onerrror: (err: any) => void,
) {
  client.connect(function(err) {
    assertIsConnected(client, err);
    const db = client.db(config.dbname);
    db.listCollections().toArray((err, results) => {
      if (err) {
        onerrror(err);
      } else {
        onsuccess(results.map(collectionInfos => collectionInfos.name).sort());
      }
    });
  });
}

function _testConnection(client: MongoClient) {
  client.connect(function(err) {});
}

function setupApp(config: ServerConfig) {
  const client = new MongoClient(config.dburi, { useNewUrlParser: true });
  _testConnection(client);
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
    --configfile      path to configuration file,
                      default is ${__dirname}/playground.config.json

    --dburi           override "dburi" option from config file,
                      default is "mongodb://localhost:27107"

    --dbname          override "dbname" option from config file,
                      default is "playground-db"

    --httpPort / -p   override "httpPort" option from config file,
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
      },
    },
  );
  const config = {
    ...JSON.parse(readFileSync(cli.flags.configfile).toString()),
  };
  for (const opt of ['dburi', 'dbname', 'httpPort']) {
    if (cli.flags[opt]) {
      config[opt] = cli.flags[opt];
    }
  }
  return config;
}

const config = parseCommandLine();
setupApp(config).listen(config.httpPort, function() {
  console.log(`VQB playground app listening on port ${config.httpPort}!`);
});
