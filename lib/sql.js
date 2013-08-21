"use strict"
// Load external modules
var querystring = require("querystring"),
    pg = require('pg'),
    tool = require('./tools.js');

// create diff sql string with ini conf. Just consider single table now.
// from clause （优先级）
// fld 拆分表
// main table
// 增加空值的判断
function createSql(act, scr, conf){
  var sqlString = "";
  console.log(conf);
  var scr = conf[scr],
      tbl = scr["main table"];
  switch(act) {
    case "COUNT":
      sqlString = "select COUNT(*) AS count from " + tbl + ";"
      break;
    case "LIST":
      var flds = scr["list"][1]["field"]; //TODO why get array 2
      sqlString = "SELECT " + flds + " FROM " + tbl;
      break;
    case "DEL":
      //TODO
      var keyFld = scr["key field"];
      sqlString = "delete from " + tbl + " where " + keyFld + " = ";
      break;
    default:
      sqlString = ""
      break;
  }
 return sqlString;
}

// TODO db init
function run(sql, conf, callback) {
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
            console.log('Sql Error: ' + error.message);  
            client.end();  
            return;  
          }
          // if (results.rowCount > 0) {
            callback(results);
          // } else {
          //   console.log("error");
          //   client.end();  
          //   return; 
          // }
        });
      }
    });
  }
}

// 执行相应的SELECT语句，获取总记录数
function getTotalCount(scr, iniConf, callback) {
  var sqlString = createSql("COUNT", scr, iniConf);
  run(sqlString, iniConf, function (results) {
    if (results.rows[0].count  > 0) {
      console.log(results);
      callback(results.rows[0].count);
    }
  });
}

// ajaxquerylist
function query(queryString, conf, callback) {
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

  getTotalCount(scr, conf, function(count){
    if (count > 0) {
      totalPages =  Math.ceil(count/sys__rows__page);
    }
    if (sys__rows__page < totalPages) {
      sys__rows__page = totalPages;
    }
    console.log(totalPages);
    start = sys__query__page * sys__rows__page - sys__query__page;
    // 生成请求的 select 语句
    var sqlString = createSql("LIST", scr, conf),
        sqlString = sqlString + " ORDER BY " + sys__sort + " " + sys__order 
                  + " OFFSET " + start + " LIMIT " + sys__rows__page;
    
    // 执行相应的sql语句，返回对应的数据集合
    run(sqlString, conf, function(results) {
      var delkeys = ["fields", "_parsers", "command", "oid", "rowCount"];
      tool.deleteItemsbyKey(delkeys, results);
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
      results["sys__msg"] = count + " rows got, " + sys__rows__page;
      results["page"] = parseInt(sys__query__page);
      results["records"] = count;
      results["sys__sql"] = sqlString;
      results["total"] = totalPages;

    	callback(results);
    });

  });
}

// Delete row
function del(queryString, conf, callback){
	var scr = queryString.scr,
      ids = queryString.id;
  // Create sql string for delete.
  var sqlString = createSql("DEL", scr, conf),
  	  sqlString = sqlString + ids;
  // var sqlString = "delete from " + _tbl + " where id in (" +  ids + ");";
	console.log(sqlString);
	run(sqlString, conf, function (results) {
    if (results["rowCount"] !== 0) {
      results["sys__msg"] = results.rowCount + ","; sys__rv
      results["sys__rv"] = results.rowCount;
    } else {
      results["sys__msg"] = "0E0,";
      results["sys__rv"] = "0E0";
    }
    results["sys__err"] = "200";
    results["sys__sql"] = sqlString;
    var delkeys = ["command", "rowCount", "rows", "fields", "_parsers", "oid"];
    tool.deleteItemsbyKey(delkeys, results);
  	callback(results);
	});
}


function update(client, queryString) {  
  console.log("Update data");
  var queryString = querystring.parse(queryString),
      tbl = queryString._tbl,
      flds =  queryString._flds,
      vals =  queryString._vals,
      id =  queryString._id;
  var updateString = "update " + tbl + " set " + flds + " = '" + vals + "' where id=" + id;
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

// execute Sql for CRUD
module.exports.exec = function(action, queryString, conf, callback) {
  var results = {};
  var queryString = querystring.parse(queryString),
      scr = queryString.scr;
      console.log("GLOBAL.ini");
      console.log(conf.common);
  // if (_.contains(Object.keys(conf), scr)) {
  if (conf.hasOwnProperty(scr)) {
    switch(action) {
      case "ajaxquerylist":
        query(queryString, conf, function(results){
          callback(results);
        });
        break;
      case "update":
        update(queryString);
        break;
      case "delete":
        del(queryString, conf, function(results){
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