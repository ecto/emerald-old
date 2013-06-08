var fs = require('fs');
var url = require('url');
var http = require('http');
var mime = require('mime');
var colors = require('colors');

module.exports = function emerald (options) {
  return new Core(options);
}

function Core (options) {
  options = options || {};
  this.port = options.port || 8080;

  this.plugins = [];
  this.routes = {};

  this.start();
}

Core.prototype.start = function () {
  this.createRestMethods();
  this.loadRoutes();
  this.defineHandler();

  this.use('url');
  this.use('ejs');

  this.server = http.createServer(this.handler);
};

Core.prototype.createRestMethods = function () {
  var that = this;
  var methods = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS'
  ];

  for (var i in methods) {
    (function (method) {
      that[method.toLowerCase()] = function (route, callback) {
        that.createRoute(method, route, callback);
      }
    })(methods[i]);
  }
};

Core.prototype.loadRoutes = function () {
  try { 
    var files = fs.readdirSync('routes');
  } catch (e) {}

  for (var i in files) {
    var file = require(process.cwd() + '/routes/' + files[i]);
    file && file(this);
  }
};

Core.prototype.defineHandler = function () {
  var core = this;

  this.handler = function (req, res) {
    core.plugins.forEach(function (plugin) {
      plugin(req, res);
    });

    var route = core.routes[req.pathname];
    core.log(req.method, req.url);

    // this data structure needs to be reworked
    // for dynamic routes, e.g. /user/:username
    if (route && route[req.method]) {
      route[req.method](req, res);
      return;
    }

    core.handleStatic(req, res, function () {
      res.writeHead(404);
      res.end('Cannot ' + req.method + ' ' + req.url + '\n');
    });
  };
};

Core.prototype.log = function (level, message) {
  if (!message) {
    message = level;
    level = 'info';
  }

  var color = 'cyan';

  if (level == 'error' || level == 'fatal') {
    color = 'red';
  }

  var line = level[color] + ' ' + message;
  console.log(line);
};

Core.prototype.listen = function (callback) {
  var that = this;

  this.server.listen(this.port, '0.0.0.0', function () {
    that.log('', '\bemerald'.green + ' listening on port ' + that.port.toString().blue);
    callback && callback.apply(arguments);
  });
};

Core.prototype.createRoute = function (method, route, callback) {
  if (!this.routes[route]) {
    this.routes[route] = {};
  }

  this.routes[route][method] = callback;
};

Core.prototype.use = function (name) {
  try {
    var plugin = require('emerald-' + name);
  } catch (e) {
    this.log('fatal', e.stack);
    process.exit(1);
  }

  this.plugins.push(plugin);
};

Core.prototype.handleStatic = function (req, res, cb) {
  var file = 'public' + req.pathname;

  // this may not be necessary
  // but it makes me feel good
  if (~file.indexOf('..')) {
    cb();
    return;
  }

  fs.exists(file, function (exists) {
    if (!exists) {
      cb();
      return;
    }

    fs.readFile(file, function (err, data) {
      if (err) throw err;
      var mimetype = mime.lookup(file); 
      res.setHeader('content-type', mimetype);
      res.end(data);
    });
  });
}

