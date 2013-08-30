var pg = require('pg');
var init = require("./init.js");
var confPath = './ini/hn03.ini';

module.exports.run = function (sql, callback) {
  var common = init.iniConf(confPath);
  // var common = global.ini["common"];
  if(typeof callback !== 'function') return null;
  if (common["rdb type"] === 'pg') {
  //构造连接数据库的连接字符串："tcp://用户名:密码@ip/相应的数据库名"
    var dbconfig = 'postgres://' + common["rdb user"]
                    + ':' + common["rdb pass"]
                    + '@' + common["rdb addr"]
                    + ':'+ common["rdb port"]
                    + '/' + common["rdb dbname"];
    // pg.defaults.poolSize = 20;
    pg.connect(dbconfig, function(error, client, done) {
      done();
      if (error) {
        console.log('ClientConnectionReady Error: ' + error.message);
        client.end();
        return;
      } else {
        client.query(sql, function (error, results, fields) {
          if (error) {
            console.log("error");  
            console.log('Sql Error: ' + error.message);  
            return;  
          }
          callback(results);
        });
      }
    });
  }
}