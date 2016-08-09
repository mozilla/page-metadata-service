const bodyParser = require('body-parser');
const express = require('express');
const domino = require('domino');
const fetch = require('node-fetch');
const urlparse = require('url');
const {getMetadata} = require('page-metadata-parser');

function buildObj(pairs) {
  return pairs.reduce((newObj, [key, value]) => {
    newObj[key] = value;
    return newObj;
  }, {});
}

function getDocumentMetadata(url, window) {
  const doc = window.document;
  const metadata = getMetadata(doc);

  metadata.url = url;
  metadata.original_url = url;
  metadata.provider_url = url;

  if (!metadata.favicon_url) {
    const parsedUrl = urlparse.parse(url);
    metadata.favicon_url = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
  }

  metadata.image_url = metadata.image_url && metadata.image_url.replace(/^\/\//, 'https://');
  metadata.images = [{
    entropy: 1.0,
    height: 500,
    url: metadata.image_url,
    width: 500,
  }];

  console.log(`Generated Metadata for ${url}:\n${JSON.stringify(metadata)}`); // eslint-disable-line no-console

  return metadata;
}


function getUrlMetadata(url) {
  return fetch(url)
    .then((res) => res.text())
    .then((body) => getDocumentMetadata(url, domino.createWindow(body)))
    .catch((err) => ({}));
}

const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.post('/', function(req, res) {
  const response = {
    error: '',
    urls: []
  };
  const fail = (reason) => {
    response.error = reason;
    res.json(response);
  };

  if (!req.body.urls) {
    fail(`Unable to locate 'urls' in body: ${JSON.stringify(req.body)}`);
    return;
  }

  const promises = req.body.urls.map((url) => getUrlMetadata(url));

  Promise.all(promises)
    .then((urlsData) => {
      response.urls = buildObj(urlsData.map((urlData) => [urlData.url, urlData]));
      res.json(response);
    })
    .catch((err) => fail(err.message));
});

app.listen(7001, function() {
});
