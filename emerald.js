
var fs = require('fs');
var url = require('url');
var http = require('http');
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

  this.use('emerald-ejs');

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
    augment(req, res);
    var route = core.routes[req.pathname];
    core.log(req.method, req.url);

    // this data structure needs to be reworked
    // for dynamic routes, e.g. /user/:username
    if (route && route[req.method]) {
      core.plugins.forEach(function (plugin) {
        plugin(req, res);
      });

      route[req.method](req, res);
      return;
    }

    res.writeHead(404);
    res.end('Cannot ' + req.method + ' ' + req.url + '\n');
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
    var plugin = require(name);
  } catch (e) {
    this.log('fatal', e.message);
    process.exit(1);
  }

  this.plugins.push(plugin);
};

function augment (req, res) {
  var info = url.parse(req.url);
  for (var i in info) {
    req[i] = info[i];
  }

  req.params = {};

  return req;
}

function augmentResponse (rawRes) {
  var res = rawRes;

  // execute middleware
  res.send = function () {

  };

  res.render = function (view, locals) {
    res.end('hi\n');
  };

  return res;
}
