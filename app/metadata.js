const domino = require('domino');
const fastimage = require('fastimage');
const parser = require('page-metadata-parser');
const statsdClient = require('./statsd');
require('isomorphic-fetch');

// See https://github.com/mozilla/page-metadata-service/issues/89#issuecomment-243931889
fastimage.threshold(-1);

function fetchUrlContent(url) {
  const startFetch = statsdClient.getTimestamp();

  return fetch(url, {
      headers: {
        'User-Agent': 'Mozilla Metadata Service https://github.com/mozilla/page-metadata-service'
      }
    }).then(res => {
    const endFetch = statsdClient.getTimestamp();
    statsdClient.timing('fetch_time', (endFetch - startFetch));

    if (res.status >= 200 && res.status < 300) {
      statsdClient.increment('fetch_success');
      return res;
    } else {
      throw new Error(`Request Failure: ${res.status} ${res.statusText}`);
    }
  }).then(res => res.text())
  .catch(e => {
    statsdClient.increment('fetch_fail');

    const endFetch = statsdClient.getTimestamp();
    statsdClient.timing('fetch_time', (endFetch - startFetch));

    throw e;
  });
}

function getHtmlDocument(html) {
  return domino.createWindow(html).document;
}

function getImageInfo(imageUrl) {
  const startImage = statsdClient.getTimestamp();

  return fastimage.info(imageUrl).then(info => {
    const endImage = statsdClient.getTimestamp();
    statsdClient.timing('image_time', (endImage - startImage));
    statsdClient.increment('image_success');

    return info;
  }).catch(e => {
    const endImage = statsdClient.getTimestamp();
    statsdClient.timing('image_time', (endImage - startImage));
    statsdClient.increment('image_fail');

    throw e;
  });
}

function getDocumentMetadata(url, doc) {
  const parsedMetadata = parser.getMetadata(doc, url);

  const urlMetadata = {
    url: parsedMetadata.url,
    original_url: url,
    provider_name: parsedMetadata.provider,
    title: parsedMetadata.title,
    description: parsedMetadata.description,
    favicon_url: parsedMetadata.icon_url,
    images: []
  };

  if (parsedMetadata.image_url) {
    return getImageInfo(parsedMetadata.image_url).then(imageInfo => {
      urlMetadata.images = [{
        url: parsedMetadata.image_url,
        width: imageInfo.width,
        height: imageInfo.height,
      }];

      return urlMetadata;
    }).catch(e => urlMetadata);
  } else {
    return Promise.resolve(urlMetadata);
  }
}

function getUrlMetadata(url) {
  const result = {
    url,
    data: null,
    error: null,
  };

  return fetchUrlContent(url)
    .then(html => getDocumentMetadata(url, getHtmlDocument(html)))
    .then(metadata => {
      result.data = metadata;
      return result;
    }).catch(e => {
      result.error = e;
      return result;
    });
}

module.exports = {
  fetchUrlContent,
  getDocumentMetadata,
  getHtmlDocument,
  getImageInfo,
  getUrlMetadata,
};
