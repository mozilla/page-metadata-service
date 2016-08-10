const bodyParser = require('body-parser');
const express = require('express');
const domino = require('domino');
const urlparse = require('url');
const {getMetadata} = require('page-metadata-parser');
require('isomorphic-fetch');

const errorMessages = {
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

function makeUrlAbsolute(base, relative) {
  const relativeParsed = urlparse.parse(relative);

  if (relativeParsed.host === null) {
    return urlparse.resolve(base, relative);
  }

  return relative;
}

function getDocumentMetadata(url, window) {
  const doc = window.document;
  const metadata = getMetadata(doc);

  const responseData = {
    url: url,
    provider_url: url,
    original_url: url,
    title: metadata.title,
    description: metadata.description,
    favicon_url: metadata.icon_url ? makeUrlAbsolute(url, metadata.icon_url) : makeUrlAbsolute(url, '/favicon.ico'),
    images: [{
      url: makeUrlAbsolute(url, metadata.image_url),
      width: 500,
      height: 500,
      entropy: 1.0,
    }]
  };

  console.log(`Generated Metadata for ${url}:\n${JSON.stringify(responseData)}`); // eslint-disable-line no-console

  return responseData;
}


function getUrlMetadata(url) {
  return fetch(url)
    .then((res) => {
      if (res.status >= 200 && res.status < 300) {
        return res;
      } else {
        const error = new Error(res.statusText);
        error.res = res;
        throw error;
      }
    })
    .then((res) => res.text())
    .then((body) => getDocumentMetadata(url, domino.createWindow(body)))
    .catch((err) => {
      return {};
    });
}

const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.post('/', function(req, res) {
  const responseData = {
    error: '',
    urls: []
  };

  const fail = (reason, status) => {
    responseData.error = reason;
    res.status(status).json(responseData);
  };

  if (req.headers['content-type'] !== 'application/json') {
    fail(errorMessages.headerRequired, 415);
    return;
  }

  if (!req.body.urls || req.body.urls.length <= 0) {
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

app.listen(7001, function() {
});

module.exports = {
  app,
  errorMessages
};
