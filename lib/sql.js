"use strict"
// Load external modules
var querystring = require("querystring"),
    db = require('./db.js'),
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

// 对sql执行的结果进行增加和删除
function doResults(results){
  if (results["rowCount"] !== 0) {
    results["sys__msg"] = results.rowCount + ",";
    results["sys__rv"] = results.rowCount;
  } else {
    results["sys__msg"] = "0E0,";
    results["sys__rv"] = "0E0";
  }
  results["sys__err"] = "200";
  var delkeys = ["command", "rowCount", "rows", "fields", "_parsers", "oid"];
  tool.deleteItemsbyKey(delkeys, results);
  return results;
}

// 执行相应的SELECT语句，获取总记录数
function getTotalCount(scr, callback) {
  var scrConf = global.ini[scr],
      tbl = scrConf["main table"];
  var sqlString = "select COUNT(*) AS count from " + tbl + ";"
  db.run(sqlString, function (results) {
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
    start = sys__query__page * sys__rows__page - sys__rows__page;
    // 生成请求的 select 语句
    var scrConf = global.ini[scr],
        tbl = scrConf["main table"],
        flds = scrConf["list"][1]["field"],
        where = scrConf["list"][1]["where clause"]; //TODO why get array 2

    if (where === "" && where === "undefined") {
      where = "";
    } else {
      where = " where " + where;
    }
    // 解析待查询的字段，获取表名
    var tbls = "";
    flds.split(",").forEach(function(elment,index,array){
      var tmpTbl = elment.split(".")[0].trim();
      if ( tbls.indexOf(tmpTbl) === -1 ) {
        tbls += tmpTbl + ",";
      }
    });
    tbls = tbls.split(/\,$/)[0];
    
    var sqlString = "SELECT " + flds + " FROM " + tbls + where
                    + " ORDER BY " + sys__sort + " " + sys__order 
                    + " OFFSET " + start + " LIMIT " + sys__rows__page;
    console.log(sqlString);
    // 执行相应的sql语句，返回对应的数据集合
    db.run(sqlString, function(results) {
      var rowsData = [];
      results.rows.forEach(function(elment, index, array){
        rowsData.push(elment);
      });
      var delkeys = ["fields", "_parsers", "command", "oid", "rowCount"];
      tool.deleteItemsbyKey(delkeys, results);

      results["rows"] = rowsData;
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
      // results["rows"] = rowsData;
      results["sys__msg"] = count + " rows got, " + sys__rows__page;
      results["page"] = parseInt(sys__query__page);
      results["records"] = count;
      results["sys__sql"] = sqlString;
      results["total"] = totalPages;

      callback(results);

    });

  });
}

function langCatName(rawData, cat){
  var cats = db.run(cat, true);
  var delkeys = ["fields", "_parsers", "command", "oid", "rowCount"];
  tool.deleteItemsbyKey(delkeys, cats);
  rawData.forEach(function(elment, index, array){
    cats.rows.forEach(function(inelment, inindex, inarray){
      if ( elment["fld"] !== null && elment["fld"] !== undefined && elment["fld"].trim() === inelment["code"].trim() ) {
        elment["fld"] = inelment["name"];
      }
    });
  });
  return rawData;
}

function ajaxQueryMaster(queryString, callback){
  console.log(queryString.cond);
  var scr = queryString.scr,
      cond = queryString.cond;
  var scrConf = global.ini[scr],
      tbl = scrConf["main table"],
      mainFld = scrConf["main field"];

  var sqlString = "select " + mainFld + " from " + tbl + " where " + cond;
  db.run(sqlString, function (results){
    if (results["rowCount"] !== 0) {
      var rowData = results["rows"][0];
      if (rowData !== "") {
        Object.keys(rowData).forEach(function(key) {
          results[tbl + "." + key.trim()] = rowData[key];
        });
      }
      results["sys__msg"] = results.rowCount + ",";
      results["sys__rv"] = results.rowCount;
    } else {
      results["sys__msg"] = "0E0,";
      results["sys__rv"] = "0E0";
    }
    results["sys__err"] = "200";
    var delkeys = ["command", "rowCount", "rows", "fields", "_parsers", "oid"];
    tool.deleteItemsbyKey(delkeys, results);
    results["sys__sql"] = sqlString;
    callback(results);
  });    
}

function updateRecord(queryString, callback) {  
  console.log("Update data");
  var scr = queryString.scr;
  var scrConf = global.ini[scr],
      tbl = scrConf["main table"],
      mainFld = scrConf["main fields"],
      keyFld = scrConf["key field"],
      cond = tbl + "." + keyFld;
  // Create sql string for update.
  var sqlString = "update " + tbl + " set "; 
  Object.keys(queryString).forEach(function(elment){
    if (elment.indexOf(tbl) > -1 && elment !== cond) {
      var fld = elment.split(tbl + ".")[1];
      sqlString += fld + "='" + queryString[elment] + "',";
    }
  });

  sqlString = sqlString.split(/\,$/)[0];
  cond += "='" + queryString[cond] + "'";
  sqlString += " where " + cond;
  console.log(sqlString);

  db.run(sqlString, function(results){
    results = doResults(results);
    results["sys__sql"] = sqlString;
    callback(results);
  });
}

function addRecord(queryString, callback) {
  console.log("Add a record");
  var scr = queryString.scr,
      scrConf = global.ini[scr],
      tbl = scrConf["main table"];
  var flds = "",
      fidValues = "";

  Object.keys(queryString).forEach(function(elment){
    if (elment.indexOf(tbl + ".") > -1 && elment.indexOf("id") === -1) {
      flds += elment.split(tbl + ".")[1] + ",";
      var tmpVal = queryString[elment];
      console.log(typeof tmpVal);
      //无法判断boolean值，如何处理？
      if ( typeof(tmpVal) === "boolean") {
        fidValues += tmpVal + ",";
      } else {
        fidValues += "'" + tmpVal + "',";        
      }  
    }
  });
  flds = flds.split(/\,$/)[0];
  fidValues = fidValues.split(/\,$/)[0];
  var sqlString = "insert into "+ tbl + " (" + flds + ") values (" + fidValues + ")";
  console.log(sqlString);
  db.run(sqlString, function (results) {
    // results = doResults(results);
    results["sys__sql"] = sqlString;
    callback(results);
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

	db.run(sqlString, function (results) {
    results = doResults(results);
    results["sys__sql"] = sqlString;
  	callback(results);
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
      case "ajaxquerymaster":
        ajaxQueryMaster(queryString, function(results){
          callback(results);
        });
        break;
      case "add":
        addRecord(queryString, function(results){
          callback(results);
        });
        break;
      case "update":
        updateRecord(queryString, function(results){
          callback(results);
        });
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