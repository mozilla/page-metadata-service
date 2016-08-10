const chai = require('chai');
const chaiHttp = require('chai-http');
const fetchMock = require('fetch-mock');
const {app, errorMessages} = require('../service');

chai.use(chaiHttp);
chai.should();

const exampleMetadata = {
  description: 'An example description',
  favicon_url: 'http://www.example.com/rich-icon.png',
  icon_url: 'http://www.example.com/rich-icon.png',
  image_url: 'http://www.example.com/preview.png',
  images: [
    {
      'url': 'http://www.example.com/preview.png',
      'entropy': 1,
      'height': 500,
      'width': 500,
    }
  ],
  original_url: 'http://www.example.com/good',
  provider_url: 'http://www.example.com/good',
  title: 'An Example Page',
  url: 'http://www.example.com/good'
};

const goodExampleUrl = 'http://www.example.com/good';
const badExampleUrl = 'http://www.example.com/bad';


describe('Metadata API Tests', function() {
  afterEach(function() {
    fetchMock.restore();
  });

  it('should raise 415 if content header is not set', (done) => {
    chai.request(app)
      .post('/')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        res.should.have.status(415);
        res.body.error.should.equal(errorMessages.headerRequired);
        done();
      });
  });

  it('should raise 400 if missing JSON body', (done) => {
    chai.request(app)
      .post('/')
      .set('content-type', 'application/json')
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should raise 400 if missing urls parameter', (done) => {
    chai.request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send(JSON.stringify({}))
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should raise 400 if urls is empty', (done) => {
    chai.request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: []}))
      .end((err, res) => {
        res.should.have.status(400);
        res.body.error.should.equal(errorMessages.urlsRequired);
        done();
      });
  });

  it('should return 200 with metadata for a url', (done) => {
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
      .post('/')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          error: '',
          urls: {
            [goodExampleUrl]: exampleMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should fallback to favicon.ico if no rich icon found', (done) => {
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

    const expectedMetadata = JSON.parse(JSON.stringify(exampleMetadata));
    expectedMetadata.favicon_url = 'http://www.example.com/favicon.ico';
    delete expectedMetadata.icon_url;

    chai.request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [goodExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          error: '',
          urls: {
            [goodExampleUrl]: expectedMetadata
          }
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });

  it('should exclude urls that failed to be retrieved', (done) => {
    fetchMock.mock(
      badExampleUrl,
      500
    );

    chai.request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send(JSON.stringify({urls: [badExampleUrl]}))
      .end((err, res) => {
        const expectedResponse = {
          error: '',
          urls: {}
        };

        res.should.have.status(200);
        res.body.should.deep.equal(expectedResponse);

        done();
      });
  });
});
