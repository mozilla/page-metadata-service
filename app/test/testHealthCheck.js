const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {app} = require('../service');

chai.use(chaiHttp);
chai.should();

describe('Heartbeat Tests', function() {
  it('should return 200', (done) => {
    chai.request(app)
      .get('/__heartbeat__')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('LBHeartbeat Tests', function() {
  it('should return 200', (done) => {
    chai.request(app)
      .get('/__lbheartbeat__')
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });
});

describe('Version Tests', function() {
  it('should return 200 and version data', (done) => {
    chai.request(app)
      .get('/__version__')
      .end((err, res) => {
        res.should.have.status(200);
        assert(res.body.hasOwnProperty('commit'));
        assert(res.body.hasOwnProperty('version'));
        assert(res.body.hasOwnProperty('source'));
        done();
      });
  });
});
