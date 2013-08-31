var querystring = require("querystring"),
    sql = require('./lib/sql.js');

function start(response, queryString) {
  var action = querystring.parse(queryString).action;
  console.log("test");
  console.log(queryString);
  sql.exec(action, queryString, GLOBAL.ini, function(results){
    response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
    //先将results 字符串内容转化成json格式，然后响应到浏览器上  
    response.write(JSON.stringify(results));
    response.end();
  });
}

// function poolyes(response, queryString) {
//   var pg = require('pg');
//   var http = require("http");
//   var conString = "postgres://hn03:hn03@192.168.2.18:5432/hn03";
//   var results = {};

//   // pg.defaults.poolSize = 20;
//   pg.connect(conString, function(err, client, done) {
//     if(err) {
//       return console.error('error fetching client from pool', err);
//     }
//     client.query('SELECT * from question limit 100', [], function(err, result) {
//       //call `done()` to release the client back to the pool
//       done();

//       if(err) {
//         return console.error('error running query', err);
//       }
//       console.log(result.rowCount);
//       results = result;
//       response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
//       //先将results 字符串内容转化成json格式，然后响应到浏览器上  
//       response.write(JSON.stringify(results));
//       response.end();
//       //output: 1
//     });
//   });
// }

// function poolno(response, queryString) {
//   var pg = require('pg');
//   var http = require("http");
//   var conString = "postgres://hn03:hn03@192.168.2.18:5432/hn03";
//   var results = {};

//   var client = new pg.Client(conString);
//   client.connect(function(err) {
//     if(err) {
//       return console.error('could not connect to postgres', err);
//     }
//     client.query('SELECT * from question limit 100', function(err, result) {
//       if(err) {
//         return console.error('error running query', err);
//       }
//       results = result;
//       //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
//       client.end();
//       response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
//       //先将results 字符串内容转化成json格式，然后响应到浏览器上  
//       response.write(JSON.stringify(results));
//       response.end();
//     });
//   });
// }

exports.start = start;
// exports.poolno = poolno;
// exports.poolyes = poolyes;