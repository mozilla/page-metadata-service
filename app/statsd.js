const statsd = require('node-statsd');

const statsdClient = new statsd({host: process.env.STATSD_HOST});

statsdClient.getTimestamp = function() {
  return Math.floor(new Date() / 1000);
};

module.exports = statsdClient;
