const bodyParser = require('body-parser');
const express = require('express');
const jsdom = require('jsdom');
const urlparse = require('url');
const {getMetadata} = require('page-metadata-parser');


function buildObj(pairs) {
  return pairs.reduce((newObj, [key, value]) => {
    newObj[key] = value;
    return newObj;
  }, {});
}


function getDocumentMetadata(url, doc) {
  let metadata = getMetadata(doc);

  metadata.url = url;
  metadata.original_url = url;
  metadata.provider_url = url;

  if (!metadata.favicon_url) {
    const parsedUrl = urlparse.parse(url);
    metadata.favicon_url = parsedUrl.protocol + '//' + parsedUrl.host + '/favicon.ico';
  }

  metadata.image = metadata.image && metadata.image.replace(/^\/\//, 'https://');

  return metadata;
}


function getUrlMetadata(url) {
  return new Promise((resolve, reject) => {
    jsdom.env({
      url: url,
      done: function(err, window) {
        if (!window) {
          resolve({});
          return;
        }

        resolve(getDocumentMetadata(url, window.document));
      }
    });
  });
}


const app = express();
app.use(bodyParser.json()); // for parsing application/json

app.post('/', function(req, res) {
  const promises = req.body.urls.map((url) => {
    return getUrlMetadata(url);
  });

  Promise.all(promises).then((urlsData) => {
    res.json({
      error: '',
      urls: buildObj(urlsData.map((urlData) => [urlData.url, urlData]))
    });
  });
});

app.listen(7001, function() {
});
