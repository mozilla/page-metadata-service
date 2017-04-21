const chai = require('chai');
const chaiHttp = require('chai-http');
const fetchMock = require('fetch-mock');
const fastimage = require('fastimage');
const parser = require('page-metadata-parser');
const {app, errorMessages} = require('../service');

chai.use(chaiHttp);
chai.should();

const goodExampleUrl = 'http://www.example.com/good';
const badExampleUrl = 'http://www.example.com/bad';

const originalGetMetadata = parser.getMetadata;

function getExampleImageData() {
  return {
    height: 123,
    width: 456,
    url: 'http://www.example.com/preview.png',
  };
}

function getExampleMetadata() {
  return {
    url: 'http://www.example.com/good',
    original_url: 'http://www.example.com/good',
    provider_name: 'example',
    title: 'An Example Page',
    description: 'An example description',
    favicon_url: 'http://www.example.com/rich-icon.png',
    images: [getExampleImageData()],
  };
}

describe('Metadata API Tests', function() {
  afterEach(function() {
    fetchMock.restore();
  });

  beforeEach(function() {
    fetchMock.mock('http://www.example.com/robots.txt', 'User-agent: * Allow: /');

    // restore getMetadata
    parser.getMetadata = originalGetMetadata;

    // Mock fastimage
    fastimage.info = function(url) {
      return new Promise(resolve => resolve(getExampleImageData()));
    };
  });

  it('should raise 415 if content header is not set', (done) => {
    chai.request(app)
      .post('/v1/metadata')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        res.should.have.status(415);
        res.body.request_error.should.equal(errorMessages.headerRequired);
        done();
      });
  });

  it('should raise 400 if missing JSON body', (done) => {
    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.request_error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should raise 400 if missing urls parameter', (done) => {
    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({}))
      .end((err, res) => {
        res.should.have.status(400);
        res.body.request_error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should raise 400 if urls is empty', (done) => {
    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: []}))
      .end((err, res) => {
        res.should.have.status(400);
        res.body.request_error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should return 400 if too many urls requested', (done) => {
    app.set('maxUrls', 2);

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [
        'http://example.com/1',
        'http://example.com/2',
        'http://example.com/3'
      ]}))
      .end((err, res) => {
        res.should.have.status(400);
        res.body.request_error.should.equal(errorMessages.maxUrls);
        done();
      });
  });

  it('should return 200 with metadata for a url', (done) => {
    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${exampleMetadata.images[0].url}" />
            <link rel="icon" href="http://www.example.com/rich-icon.png" />
          </head>
          <body></body>
        </html>
      `
    );

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {},
          urls: {
            [goodExampleUrl]: exampleMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should return 200 with metadata for a url if fastimage fails', (done) => {
    fastimage.info = function(url) {
      return new Promise((resolve, reject) => reject(new Error('Image parse failure!')));
    };

    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${exampleMetadata.images[0].url}" />
            <link rel="icon" href="http://www.example.com/rich-icon.png" />
          </head>
          <body></body>
        </html>
      `
    );

    const expectedMetadata = getExampleMetadata();
    expectedMetadata.images = [];

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {},
          urls: {
            [goodExampleUrl]: expectedMetadata,
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should fallback to favicon.ico if no rich icon found', (done) => {
    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${exampleMetadata.images[0].url}" />
          </head>
          <body></body>
        </html>
      `
    );

    const expectedMetadata = getExampleMetadata();
    expectedMetadata.favicon_url = 'http://www.example.com/favicon.ico';

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {},
          urls: {
            [goodExampleUrl]: expectedMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should return errors for urls which failed to be fetched', (done) => {
    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      badExampleUrl,
      500
    );

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${exampleMetadata.images[0].url}" />
            <link rel="icon" href="http://www.example.com/rich-icon.png" />
          </head>
          <body></body>
        </html>
      `
    );

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [
        goodExampleUrl,
        badExampleUrl
      ]}))
      .end((err, res) => {
        res.should.have.status(200);


        const expectedResponse = {
          request_error: '',
          url_errors: {
            'http://www.example.com/bad': 'Error: Request Failure: 500 Internal Server Error',
          },
          urls: {
            'http://www.example.com/good': getExampleMetadata(),
          }
        };

        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should return errors for urls which failed to be parsed', (done) => {
    parser.getMetadata = function(doc, url) {
      throw new Error('Failed to parse HTML');
    };

    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${exampleMetadata.images[0].url}" />
            <link rel="icon" href="http://www.example.com/rich-icon.png" />
          </head>
          <body></body>
        </html>
      `
    );

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {
            [goodExampleUrl]: 'Error: Failed to parse HTML',
          },
          urls: {}
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should only return absolute URLs', (done) => {
    const exampleMetadata = getExampleMetadata();

    const baseUrl = 'http://www.example.com';
    const relativeImageUrl = '/media/image.png';
    const absoluteImageUrl = baseUrl + relativeImageUrl;
    const relativeIconUrl = '/rich-icon.png';
    const absoluteIconUrl = baseUrl + relativeIconUrl;

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <meta name="thumbnail" content="${relativeImageUrl}" />
            <link rel="icon" href="${relativeIconUrl}" />
          </head>
          <body></body>
        </html>
      `
    );

    const expectedMetadata = getExampleMetadata();
    expectedMetadata.images[0].url = absoluteImageUrl;
    expectedMetadata.favicon_url = absoluteIconUrl;

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {},
          urls: {
            [goodExampleUrl]: expectedMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should return no image entry if no preview found', (done) => {
    const exampleMetadata = getExampleMetadata();

    fetchMock.mock(
      goodExampleUrl,
      `
        <html>
          <head>
            <title>${exampleMetadata.title}</title>
            <meta name="description" content="${exampleMetadata.description}" />
            <link rel="icon" href="${exampleMetadata.favicon_url}" />
          </head>
          <body></body>
        </html>
      `
    );

    const expectedMetadata = getExampleMetadata();
    expectedMetadata.images = [];

    chai.request(app)
      .post('/v1/metadata')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          request_error: '',
          url_errors: {},
          urls: {
            [goodExampleUrl]: expectedMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });
});

describe('Stub Tests', function() {
  it('should raise 404 if root path is hit', (done) => {
    chai.request(app)
      .post('/')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.error.should.equal(errorMessages.badPath);
        done();
      });
  });
});
