#!/usr/bin/env node

'use strict';

var cluster = require('cluster'),
    numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker) {
    console.log('worker ' + worker.process.pid + ' died');
  });

} else {

  // Module dependencies.
  var express = require('express'),
    http = require('http'),
    path = require('path'),
    //memwatch = require('memwatch'),
    toobusy = require('toobusy-js');

  //memwatch.on('leak', function(d) {
//  console.log('LEAK:', d);
  //});

  var config = (process.env.NODE_ENV === 'development') ?
    require('../config.json') :
    require('../config_dist.json');

  // Controllers
  var api = require('./controllers/api');

  var app = express();

  app.use(function(req, res, next) {
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

  var dataPath = path.join(__dirname, '..', config.dataPath);
  var staticPath = path.join(__dirname, '..', config.staticPath);

  //console.log('dataPath',dataPath);
  //console.log('staticPath',staticPath);

  if ('development' === app.get('env')) {
    app.use(require('connect-livereload')());
  }

  app
    .use(express.favicon(path.join(staticPath, 'favicon.ico')))
    .use(express.cookieParser('63e2ee71-4f85-4ce9-b85e-a5926f6f038a'));

  //app.use(express.session({
  //  secret: config.secret,
  //  key: 'sid',
  //  cookie: {httpOnly: true}
  //}));

  //app.use(express.compress());

  if ('development' === app.get('env')) {
    app.use(express.static(path.join(__dirname, '../.tmp'), {maxAge: 60000}));
  }

  app
    .use(express.static(staticPath))
    .use('/data', express.static(dataPath));

  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  }

  //app.use(express.bodyParser());
  app.use(express.urlencoded());
  app.use(express.json());

  app.use(app.router);

  // api routes
  app.all('/search', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  var s = api.search(dataPath);
  app.all('/search', s);
  app.get('/search/:filename', s);

  app.get('/', function(req, res) {
    res.render('index');
  });

  app.use(function(req, res) {
    res.status(404);

    console.log('404 error:', req.originalUrl);

    // respond with html page
    if (req.accepts('html')) {
      res.sendfile(path.join(staticPath, '404.html'));
      return;
    }

    // respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
  });

  app.use(express.errorHandler({dumpExceptions: false, showStack: false}));

  app.use(function(err, req, res){
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Start server
  var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
  });

  process.on('SIGINT', function() {
    server.close();
    toobusy.shutdown();
    process.exit();
  });

}
