var http = require('http');

module.exports = function emerald (options) {
  return new Core(options);
}

function Core (options) {
  this.server;
  this.handler;
  this.port;
  this.routes;
  this.middleware;
  // get
  // post
  // put
  // delete

  this.start();
}

Core.prototype.start = function () {
  this.defineHandler();
  this.server = http.createServer(this.handler);
};

Core.prototype.defineHandler = function () {
  this.handler = function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('okay');
  };
};

Core.prototype.listen = function (callback) {
  this.server.listen(this.port, '127.0.0.1', function () {
    callback.apply(arguments);
  });
};
