var querystring = require("querystring");

function start(client, response, queryString) {
  var _act = querystring.parse(queryString)._act;
  console.log(_act);
  switch(_act) {
    case "query":
      select(client, response, queryString);
      break;
    case "update":
      update(client, response, queryString);
      break;
    case "Delete":
      deleteRows(client, response, queryString);
    default:
      break;
  }
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
      console.log("333")
      callback(results.rows[0].count);
    }
  });
}

function select(client, response, queryString) {
  console.log("Request handler 'select' was called.");
  // 解析请求的字符串，初始化
  // tab=question&_search=false&nd=1374544312797&rows=10&page=1&sidx=id&sord=desc
  var _tbl = querystring.parse(queryString)._tbl,
      _search = querystring.parse(queryString)._search,
      page = querystring.parse(queryString).page,
      rows =  querystring.parse(queryString).rows,
      sidx =  querystring.parse(queryString).sidx,
      sord = querystring.parse(queryString).sord,
      totalPages = 0,
      count = 0,
      start = 0;

  getTotalCount(client, _tbl, function(count){
    if (count > 0) {
      totalPages =  Math.ceil(count/rows);
    }
    if (page > totalPages) {
      page = totalPages;
    }
    console.log(totalPages);
    start = rows*page - rows;
    // 生成请求的 select 语句
    var selectString = "select id,descr, hint,ans,cat1,difficulty,tag,created_at,updated_at from " + _tbl
                       + " ORDER BY " + sidx + " " + sord 
                       + " OFFSET " + start + " LIMIT " + rows;
    // 执行相应的sql语句，返回对应的数据集合
    query(client, selectString, function(results) {
      //callback(results);指定为json格式输出
      response.writeHead(200,{"Content-Type":"application/json; charset=utf8"}); 
      results["page"] = parseInt(page);
      results["total"] = totalPages;
      results["count"] = count;        
      //先将results 字符串内容转化成json格式，然后响应到浏览器上  
      response.write(JSON.stringify(results));
      response.end();
    });
  });
}

function update(client, response, queryString) {  
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

// 删除一條或多條记录
function deleteRows(client, response, queryString){
  var _tbl = querystring.parse(queryString)._tbl,
      _ids = querystring.parse(queryString)._ids;

  var sqlString = "delete from " + _tbl + " where id in (" +  _ids + ");";
  console.log(sqlString);
  client.query(sqlString, function (error, results, fields) {
    if (error) {
      console.log("error");  
      console.log('GetData Error: ' + error.message);  
      client.end();  
      return;  
    }
    response.writeHead(200,{"Content-Type":"application/json; charset=utf8"});  
    //先将results 字符串内容转化成json格式，然后响应到浏览器上  
    response.write(JSON.stringify({msg: _ids}));
    response.end();
  });
}

exports.start = start;