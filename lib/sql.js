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
function createSql(act, scr){
  var sqlString = "";
  var scr = global.ini[scr],
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
      sqlString = "delete from " + tbl + " where " + keyFld + " = ?";
      break;
    case "ADD":
      //TODO
      sqlString = "insert into " + tbl + " where " + keyFld + " = ?";
      break;
    default:
      sqlString = ""
      break;
  }
 return sqlString;
}
// TODO db init
function run(sql, callback) {
  var common = global.ini["common"];
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

// 执行相应的SELECT语句，获取总记录数
function getTotalCount(scr, callback) {
  var scrConf = global.ini[scr],
      tbl = scrConf["main table"];
  var sqlString = "select COUNT(*) AS count from " + tbl + ";"
  run(sqlString, function (results) {
    if (results.rows[0].count  > 0) {
      console.log(results);
      callback(results.rows[0].count);
    }
  });
}

// ajaxquerylist
function ajaxQueryList(queryString, callback) {
  console.log("select data");
  // 解析请求的字符串，初始化
	var scr = queryString.scr,
    	_search = queryString._search, // {} cond = {}
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
    if (sys__rows__page < totalPages) {
      sys__rows__page = totalPages;
    }
    console.log(totalPages);
    start = sys__query__page * sys__rows__page - sys__query__page;
    // 生成请求的 select 语句

    // create diff sql string with ini conf. Just consider single table now.
    // from clause （优先级）
    // fld 拆分表
    // main table
    // 增加空值的判断
   
    var scrConf = global.ini[scr],
        tbl = scrConf["main table"],
        flds = scrConf["list"][1]["field"]; //TODO why get array 2

    var sqlString = "SELECT " + flds + " FROM " + tbl
                    + " ORDER BY " + sys__sort + " " + sys__order 
                    + " OFFSET " + start + " LIMIT " + sys__rows__page;
    
    // 执行相应的sql语句，返回对应的数据集合
    run(sqlString, function(results) {
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

function delRecord(queryString, callback){
	var scr = queryString.scr,
      ids = queryString.id;
  // Create sql string for delete.
  var scrConf = global.ini[scr],
      tbl = scrConf["main table"],
      keyFld = scrConf["key field"],
      sqlString = "delete from " + tbl + " where " + keyFld + " = " + ids;

  // var sqlString = "delete from " + _tbl + " where id in (" +  ids + ");";
	console.log(sqlString);
	run(sqlString, function (results) {
    if (results["rowCount"] !== 0) {
      results["sys__msg"] = results.rowCount + ",";
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

function addRecord(queryString, callback) {
  var scr = queryString.scr,
      scrConf = global.ini[scr],
      tbl = scr["main table"];

  var sqlString = "insert into " + tbl + " where " + keyFld + " = ?";

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
    response.write(JSON.stringify({res: 1, msg: ""}));
    response.end();
  });
}

// execute Sql for CRUD
module.exports.exec = function(action, queryString, conf, callback) {
  var results = {};
  global.ini = conf;
  var queryString = querystring.parse(queryString),
      scr = queryString.scr;
  // if (_.contains(Object.keys(conf), scr)) {
  if (conf.hasOwnProperty(scr)) {
    switch(action) {
      case "ajaxquerylist":
        ajaxQueryList(queryString, function(results){
          callback(results);
        });
        break;
      case "add":
        addRecord(queryString, function(results){
          callback(results);
        });
        break;
      case "update":
        update(queryString);
        break;
      case "delete":
        delRecord(queryString, function(results){
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