const statsdClient = require('./statsd');
const domino = require('domino');
const {getMetadata, makeUrlAbsolute} = require('page-metadata-parser');
require('isomorphic-fetch');

function getDocumentMetadata(url, window) {
  const doc = window.document;
  const metadata = getMetadata(doc, url);

  const responseData = {
    url: metadata.url,
    original_url: url,
    title: metadata.title,
    description: metadata.description,
    favicon_url: metadata.icon_url || makeUrlAbsolute(url, '/favicon.ico'),
    images: []
  };

  if (metadata.image_url) {
    responseData.images = [{
      url: metadata.image_url,
      width: 500,
      height: 500,
      entropy: 1.0,
    }];
  }

  return responseData;
}


function getUrlMetadata(url) {
  return new Promise((resolve) => {
    const result = {url};

    const startFetch = statsdClient.getTimestamp();
    fetch(url)
      .then((res) => {
        const endFetch = statsdClient.getTimestamp();
        statsdClient.timing('fetch_time', (endFetch - startFetch));

        if (res.status >= 200 && res.status < 300) {
          statsdClient.increment('fetch_success');
          return res;
        } else {
          statsdClient.increment('fetch_fail');
          throw new Error(`Request Failure: ${res.status} ${res.statusText}`);
        }
      })
      .then((res) => res.text())
      .then((body) => {
        const startParse = statsdClient.getTimestamp();

        try {
          const win = domino.createWindow(body);
          result.data = getDocumentMetadata(url, win);
          statsdClient.increment('parse_success');
        } catch(e) {
          statsdClient.increment('parse_fail');
          throw e;
        }

        const endParse = statsdClient.getTimestamp();
        statsdClient.timing('parse_time', (endParse - startParse));

        statsdClient.increment('metadata_success');
        resolve(result);
      })
      .catch((err) => {
        statsdClient.increment('metadata_fail');
        result.error = err;
        resolve(result);
      });
  });
}

module.exports = {
  getUrlMetadata,
};
