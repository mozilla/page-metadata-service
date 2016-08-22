const bodyParser = require('body-parser');
const express = require('express');
const raven = require('raven');
const versionData = require('./version.json');
const {getUrlMetadata} = require('./metadata');

const errorMessages = {
  badPath: 'This is not a valid path for this service.  Please refer to the documentation: https://github.com/mozilla/page-metadata-service#url-metadata',
  headerRequired: 'The content-type header must be set to application/json.',
  urlsRequired: 'The post body must be a JSON payload in the following format: {urls: ["http://example.com"]}.',
  maxUrls: 'A maximum of 20 urls can be sent for processing in one call.'
};

function buildObj(pairs) {
  return pairs.reduce((newObj, [key, value]) => {
    if(key) {
      newObj[key] = value;
    }
    return newObj;
  }, {});
}

const app = express();

const sentryDSN = process.env.SENTRY_DSN;

// The request handler must be the first item
app.use(raven.middleware.express.requestHandler(sentryDSN));

// For parsing application/json
app.use(bodyParser.json());

// Disable x-powered-by header
app.disable('x-powered-by');

app.post('/v1/metadata', function(req, res) {
  const responseData = {
    error: '',
    urls: []
  };

  const fail = (reason, status) => {
    responseData.error = reason;
    res.status(status).json(responseData);
  };

  // #45: Server fails if you try passing charset in Content-Type
  if (!(/^application\/json/).test(req.headers['content-type'])) {
    fail(errorMessages.headerRequired, 415);
    return;
  }

  if (!req.body.urls || !Array.isArray(req.body.urls) || req.body.urls.length <= 0) {
    fail(errorMessages.urlsRequired, 400);
    return;
  }

  const promises = req.body.urls.map((url) => getUrlMetadata(url));

  Promise.all(promises)
    .then((urlsData) => {
      responseData.urls = buildObj(urlsData.map((urlData) => [urlData.url, urlData]));
      res.json(responseData);
    })
    .catch((err) => {
      fail(err.message, 500);
    });
});

app.post('/', function(req, res) {
  res.status(404).json({
    error: errorMessages.badPath,
  });
});

app.get('/__heartbeat__', function(req, res) {
  res.sendStatus(200);
});

app.get('/__lbheartbeat__', function(req, res) {
  res.sendStatus(200);
});

app.get('/__version__', function(req, res) {
  res.json(versionData);
});

// The error handler must be before any other error middleware
app.use(raven.middleware.express.errorHandler(sentryDSN));

app.listen(7001, function() {
});

module.exports = {
  app,
  errorMessages
};
