import express = require('express');
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import { mongodb } from './config';

const client = new MongoClient(mongodb.url);

function executeQuery(
  collectionName: string,
  query: Array<object>,
  next: (results: object) => void,
  errback: (err: any) => void,
) {
  client.connect(function(err) {
    const db = client.db(mongodb.dbname);
    const collection = db.collection(collectionName);
    collection.aggregate(query).toArray(function(err, docs) {
      if (err) {
        errback(err);
      } else {
        next(docs);
      }
    });
  });
}

function logError(error: any) {
  console.error(error);
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.post('/query', (req, res) => {
  executeQuery(req.body.collection, req.body.query, res.json.bind(res), console.error);
});

app.use(express.static(__dirname + '/dist'));
app.listen(3000, function() {
  console.log('VQB playground app listening on port 3000!');
});
