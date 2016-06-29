const {parse} = require('url');
const Hapi = require('hapi');
const Joi = require('joi');
const jsdom = require('jsdom');
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
    const parsedUrl = parse(url);
    metadata.favicon_url = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
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


const server = new Hapi.Server();
server.connection({
  port: 7001
});

server.route({
  method: 'POST',
  path: '/',
  config: {
    validate: {
      payload: {
        urls: Joi.array().required()
      }
    }
  },
  handler: (req, reply) => {
    const promises = req.payload.urls.map((url) => getUrlMetadata(url));

    Promise.all(promises)
      .then((urlsData) => {
        return reply({
          error: '',
          urls: buildObj(urlsData.map((urlData) => [urlData.url, urlData]))
        });
      });
  }
});

server.start((err) => {
  if (err) {
    throw err;
  }

  console.log('Server running at: %s', server.info.uri); // eslint-disable-line no-console
});
