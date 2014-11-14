#!/usr/bin/env node

'use strict';

// Module dependencies.
var express = require('express'),
    http = require('http'),
    path = require('path');

var config = (process.env.NODE_ENV === 'development') ?
  require('../config.json') :
  require('../config_dist.json');

// Controllers
var api = require('./controllers/api');

var app = express();

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

if ('development' === app.get('env')) {
  app.use(express.static(path.join(__dirname, '../.tmp'), {maxAge: 60000}));
}

app
  .use(express.static(staticPath))
  .use('/data', express.static(dataPath));

if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.use(express.bodyParser());
//app.use(express.methodOverride());

app.use(express.compress());
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

// Start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});