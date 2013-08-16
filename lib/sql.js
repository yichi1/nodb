"use strict"
// Load external modules
var _ = require("underscore"),
    querystring = require("querystring"),
    pg = require('pg');

// Load ini configure file, and parse ini
var conf = './ini/hn03.ini',
    parser = require('./parseIni.js'),
    conf = parser.parseIni(conf);

// execute Sql for CRUD
module.exports.execSql = function(action, queryString, callback) {
	var results = {};
  var queryString = querystring.parse(queryString),
      scr = queryString.scr;

  if (_.contains(Object.keys(conf), scr)) {
    switch(action) {
      case "ajaxquerylist":
        execSelect(queryString, function(results){
          callback(results);
        });
        break;
      case "update":
        update(queryString);
        break;
      case "delete":
        execDelete(queryString, function(results){
          callback(results);
        });
        break;
      default:
        break;
    }
  } else {
    // TODO
    // When scr not exists, must do something.
    callback({sys__err: 0, sys__msg: "scr not exists."});
  }
};

// create diff sql string with ini conf. Just consider single table now.
// from clause （优先级）
// fld 拆分表
// main table
// 增加空值的判断
function createSql(act, scr){
  var sqlString = "";
  var scr = conf[scr],
      _tbl = scr["main table"];
  switch(act) {
    case "COUNT":
      sqlString = "select COUNT(*) AS count from " + _tbl + ";"
      break;
    case "LIST":
      var _flds = scr["list"][1]["field"]; //TODO why get array 2
      sqlString = "SELECT " + _flds + " FROM " + _tbl;
      break;
    case "delete":
      //TODO
      break;
    default:
      sqlString = ""
      break;
  }
 return sqlString;
}

function query(sql, callback) {
  var common = conf["common"];
  if (common["rdb type"] == 'pg') {
  //构造连接数据库的连接字符串："tcp://用户名:密码@ip/相应的数据库名"
    var conString = 'pg://' + common["rdb user"]
                    + ':' + common["rdb pass"]
                    + '@' + common["rdb addr"]
                    + ':'+ common["rdb port"]
                    + '/' + common["rdb dbname"];
    // pg method initialString?
    pg.connect(conString, function(error, client, done) {
      if (error) {
        console.log('ClientConnectionReady Error: ' + error.message);
        client.end();
        return;
      } else {
        client.query(sql, function (error, results, fields) {
          if (error) {
            console.log("error");  
            console.log('GetData Error: ' + error.message);  
            client.end();  
            return;  
          }
          if (results.rowCount > 0) {
            callback(results);
          }
        });
      }
    });
  }
}

// 执行相应的SELECT语句，获取总记录数
function getTotalCount(scr, callback) {
  var sqlString = createSql("COUNT", scr);
  query(sqlString, function (results) {
    if (results.rows[0].count  > 0) {
      console.log(results);
      callback(results.rows[0].count);
    }
  });
}

// ajaxquerylist
function execSelect(queryString, callback) {
  console.log("select data");
  // 解析请求的字符串，初始化
	var scr = queryString.scr,
    	_search = queryString._search,
    	sys__query__page = queryString.sys__query__page,
    	sys__rows__page =  queryString.sys__rows__page,
    	sys__sort =  queryString.sys__sort,
    	sys__order = queryString.sys__order,
    	_datatype = queryString._datatype,
    	totalPages = 0,
    	count = 0,
    	start = 0;

  getTotalCount(scr, function(count){
    if (count > 0) {
      totalPages =  Math.ceil(count/sys__rows__page);
    }
    if (sys__rows__page > totalPages) {
      sys__rows__page = totalPages;
    }
    console.log(totalPages);
    start = sys__query__page*sys__rows__page - sys__query__page;
    // 生成请求的 select 语句
    var sqlString = createSql("LIST", scr),
        sqlString = sqlString + " ORDER BY " + sys__sort + " " + sys__order 
                  + " OFFSET " + start + " LIMIT " + sys__rows__page;
    
    // 执行相应的sql语句，返回对应的数据集合
    query(sqlString, function(results) {
      // _datatype 为array，行数据以Array方式输出
      if (_datatype === "array") {
        var rows = results["rows"];
        for (var i = 0; i < rows.length; i++) {
          var rowVals = [];
          Object.keys(rows[i]).forEach(function(key) {
            rowVals.push(rows[i][key]);
          });
          rows[i] = { id: rows[i]["id"], cell: rowVals };
        }
      }
      
      results["page"] = parseInt(sys__query__page);
     	results["total"] = totalPages;
      results["records"] = count;
    	callback(results);
    });

  });
}

// Delete row
function execDelete(client, queryString, callback){
	var queryString = querystring.parse(queryString),
		  scr = queryString.scr,
      ids = queryString.id;

  var scr = conf[scr], //get info from ini conf.
      _tbl = scr["main table"];

  	var sqlString = "delete from " + _tbl + " where id in (" +  ids + ");";
  	console.log(sqlString)
  	client.query(sqlString, function (error, results, fields) {
    	if (error) {
      		console.log("error");  
      		console.log('GetData Error: ' + error.message);  
      		client.end();  
      		return;  
    	}
    	callback(results);
  	});
}


function update(client, queryString) {  
  console.log("Update data");
  var _tbl = querystring.parse(queryString)._tbl,
      _flds =  querystring.parse(queryString)._flds,
      _vals =  querystring.parse(queryString)._vals,
      _id =  querystring.parse(queryString)._id;
  var updateString = "update " + _tbl + " set " + _flds + " = '" + _vals + "' where id=" + _id;
  console.log(updateString);
  client.query(updateString, function(error, result){
    if(error) {
      console.log("error");  
      console.log('GetData Error: ' + error.message);  
      client.end();  
      return;  
    }     
    response.writeHead(200,{"Content-Type":"application/json; charset=utf8"});  
    //先将results 字符串内容转化成json格式，然后响应到浏览器上  
    response.write(JSON.stringify({res: 1, msg: "记录更新成功!"}));
    response.end();
  });
}

// // why?
// module.exports.createSql = function(tbl, fld, where) {
//   return createSql(tbl, fld, where);
// };
