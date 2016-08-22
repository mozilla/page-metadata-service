const domino = require('domino');
const urlparse = require('url');
const {getMetadata} = require('page-metadata-parser');
require('isomorphic-fetch');

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
    url,
    original_url: url,
    title: metadata.title,
    description: metadata.description,
    favicon_url: metadata.icon_url ? makeUrlAbsolute(url, metadata.icon_url) : makeUrlAbsolute(url, '/favicon.ico'),
    images: []
  };

  if (metadata.image_url) {
    responseData.images = [{
      url: makeUrlAbsolute(url, metadata.image_url),
      width: 500,
      height: 500,
      entropy: 1.0,
    }];
  }

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

module.exports = {
  getUrlMetadata,
};
