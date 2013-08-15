var querystring = require("querystring");

var conf = './ini/hn03.ini',//configure file
    parser = require('./parseIni.js'),
    conf = parser.parseIni(conf);

module.exports.execSql = function(action, client, queryString, callback) {
	var results = {};
	switch(action) {
	    case "query":
      	select(client, queryString, function(results){
      		callback(results);
      	});
      	break;
	    case "update":
      	update(client, queryString);
      	break;
	    case "delete":
      	console.log("delete23432423");
      	deleteRows(client, queryString, function(results){
      		callback(results);
      	});
      	break;
	    default:
	      	break;
  	}
};

// why?
module.exports.createSql = function(tbl, fld, where) {
	return createSql(tbl, fld, where);
};

function createSql(tbl, fld){
	// from clause （优先级）
	// fld 差分表
	// main table
	// 增加空值的判断
	var sqlString = "SELECT " + fld 
					 + " FROM " + tbl + " limit 50";
					 // + "WHERE" + where;
	return sqlString;
}

function query(client, sql, callback) {
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

// 执行相应的SELECT语句，获取总记录数
function getTotalCount(client, _tbl, callback) {
  client.query("select COUNT(*) AS count from " + _tbl + ";", function (error, results, fields) {
    if (error) {
      console.log("error");  
      console.log('GetData Error: ' + error.message);  
      client.end();  
      return;  
    }
    if (results.rows[0].count  > 0) {
      callback(results.rows[0].count);
    }
  });
}

// select for list
function select(client, queryString, callback) {
  console.log("Request handler 'select' was called.");
  // 解析请求的字符串，初始化
  	var queryString = querystring.parse(queryString),
  	  	scr = queryString.scr,
      	_search = queryString._search,
      	sys__query__page = queryString.sys__query__page,
      	sys__rows__page =  queryString.sys__rows__page,
      	sys__sort =  queryString.sys__sort,
      	sys__order = queryString.sys__order,
      	_datatype = queryString._datatype,
      	totalPages = 0,
      	count = 0,
      	start = 0;

  // if (!conf[scr]) return {};
  //get table info form conf.ini
  var scr = conf[scr],   
      _tbl = scr["main table"],
      _flds = scr["list"][1]["field"];

  getTotalCount(client, _tbl, function(count){
    if (count > 0) {
      totalPages =  Math.ceil(count/sys__rows__page);
    }
    if (sys__rows__page > totalPages) {
      sys__rows__page = totalPages;
    }
    console.log(totalPages);
    start = sys__query__page*sys__rows__page - sys__query__page;
    // 生成请求的 select 语句
    var selectString = "SELECT " + _flds + " FROM " + _tbl
                       + " ORDER BY " + sys__sort + " " + sys__order 
                       + " OFFSET " + start + " LIMIT " + sys__rows__page;
                       console.log(selectString)
    // 执行相应的sql语句，返回对应的数据集合
    query(client, selectString, function(results) {
      // _datatype 为array，行数据以Array方式输出
      if (_datatype === "array") {
        var rows = results["rows"];
        newRows = {};
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
function deleteRows(client, queryString, callback){
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

