import express = require('express');
const app: express.Application = express();

app.get('/', function(req, res) {
  res.send('Hello VQB!');
});

app.listen(3000, function() {
  console.log('VQB playground app listening on port 3000!');
});
