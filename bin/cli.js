#!/usr/bin/env node

/* eslint-disable no-console */

const {parseUrls} = require('../lib');

const args = require('yargs')
  .usage('Usage: $0 --url [url]')
  .alias('u', 'url')
  .array('u')
  .demand('u')
  .help()
  .argv;

parseUrls(args.u)
  .then((urlsData) => {
    console.log(JSON.stringify(urlsData, null, 2));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(2);
  });
