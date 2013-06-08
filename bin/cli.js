#!/usr/bin/env node

var fs = require('fs');
var ncp = require('ncp');
var colors = require('colors');
var program = require('commander');

program.version('0.0.1');

program
  .command('create <name>')
  .description('create a boilerplate emerald app')
  .action(function (name) {
    fs.exists(name, function (exists) {
      if (!exists) {
        copyBoilerplate(name);
      } else {
        program.confirm('destination not empty. continue? ', function (ok) {
          if (ok) {
            copyBoilerplate(name);
          }
        });
      }
    });
  });

program
  .command('start')
  .description('start an emerald server in the current directory')
  .action(function (name) {
    // TODO config
    var app = process.app = require('../')();
    app.listen();
  });

if (!process.argv[2]) {
  kill();
}

program.parse(process.argv);

function kill () {
  program.help();
  process.exit(1);
}

function copyBoilerplate (name) {
  ncp(__dirname + '/../node_modules/emerald-boilerplate', name, function (err) {
    if (err) {
      return console.error(err);
    }

    console.log('done!');
    process.exit();
  });
}
