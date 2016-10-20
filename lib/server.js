#!/usr/bin/env node

'use strict';

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', worker => {
    console.error('worker ' + worker.process.pid + ' died');  // eslint-disable-line no-console
  });
} else {
  // Module dependencies.
  const express = require('express');
  const http = require('http');
  const path = require('path');
  // const memwatch = require('memwatch'),
  const toobusy = require('toobusy-js');
  const favicon = require('serve-favicon');
  const cookieParser = require('cookie-parser');
  const bodyParser = require('body-parser');
  const errorhandler = require('errorhandler');

  // memwatch.on('leak', function(d) {
  //  console.log('LEAK:', d);
  // });

  // process.env.NODE_ENV = 'development';

  const config = (process.env.NODE_ENV === 'development') ?
    require('../config.json') :
    require('../config_dist.json');

  // Controllers
  const api = require('./controllers/api');

  const app = express();

  app.use((req, res, next) => {
    if (toobusy()) {
      res.send(503, 'I\'m busy right now, sorry.');
    } else {
      next();
    }
  });

  // all environments
  app
    .set('port', process.env.PORT || config.port || 9779)
    .set('env', (process.env.NODE_ENV || config.env || 'development').toLowerCase());

  app.disable('x-powered-by');

  const dataPath = path.join(__dirname, '..', config.dataPath);
  const staticPath = path.join(__dirname, '..', config.staticPath);

  // console.log('dataPath',dataPath);
  // console.log('staticPath',staticPath);

  if (app.get('env') === 'development') {
    app.use(require('connect-livereload')());
  }

  app
    .use(favicon(path.join(staticPath, 'favicon.ico')))
    .use(cookieParser('63e2ee71-4f85-4ce9-b85e-a5926f6f038a'));

  // app.use(express.session({
  //  secret: config.secret,
  //  key: 'sid',
  //  cookie: {httpOnly: true}
  // }));

  // app.use(express.compress());

  if (app.get('env') === 'development') {
    app.use(express.static(path.join(__dirname, '../.tmp'), {maxAge: 60000}));
  }

  app
    .use(express.static(staticPath))
    .use('/data', express.static(dataPath));

  // app.use(express.bodyParser());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  // app.use(app.router);

  // api routes
  app.all('/search', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  const s = api.search(dataPath);
  app.all('/search', s);
  app.get('/search/:filename', s);

  app.get('/', (req, res) => {
    res.render('index');
  });

  app.use((req, res) => {
    res.status(404);

    console.error('404 error:', req.originalUrl); // eslint-disable-line no-console

    // respond with html page
    if (req.accepts('html')) {
      res.sendfile(path.join(staticPath, '404.html'));
      return;
    }

    // respond with json
    if (req.accepts('json')) {
      res.send({error: 'Not found'});
      return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
  });

  app.use(errorhandler({dumpExceptions: false, showStack: false}));

  app.use((err, req, res) => {
    console.error(err.stack); // eslint-disable-line no-console
    res.status(500).send('Something broke!');
  });

  // Start server
  const server = http.createServer(app).listen(app.get('port'), () => {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env')); // eslint-disable-line no-console
  });

  process.on('SIGINT', () => {
    server.close();
    toobusy.shutdown();
    process.exit();
  });
}
