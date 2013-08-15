var querystring = require("querystring"),
    sql = require('./lib/sql.js');

function start(client, response, queryString) {
  var action = querystring.parse(queryString).action;
  sql.execSql(action, client, queryString, function(results){
      response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
      //先将results 字符串内容转化成json格式，然后响应到浏览器上  
      response.write(JSON.stringify(results));
      response.end();
  });
}

exports.start = start;