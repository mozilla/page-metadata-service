const bodyParser = require('body-parser');
const express = require('express');
const {parseUrls} = require('./lib');

const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.post('/', function(req, res) {
  parseUrls(req.body.urls)
    .then((urlsData) => {
      res.json(urlsData);
    });
});

app.listen(7001, function() {
});
