var querystring = require("querystring"),
    sql = require('./lib/sql.js');

function start(response, queryString) {
  var action = querystring.parse(queryString).action;
  sql.exec(action, queryString, GLOBAL.ini, function(results){
      response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
      //先将results 字符串内容转化成json格式，然后响应到浏览器上  
      response.write(JSON.stringify(results));
      response.end();
  });
}

exports.start = start;