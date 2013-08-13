//加载相应的模块，这儿使用的是postgresql数据库，因此加载的模块是pg。使用不同的数据库可以加载相应 
var pg = require('pg');

// 加载内部模块
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

 // var Cache = require('node-cache-system');
  /* Use in-memory */
  // var inMemoryCache = new Cache();


//将url路径对应到相应的函数  
var handle = {}
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/select"] = requestHandlers.select;

//构造连接数据库的连接字符串："tcp://用户名:密码@ip/相应的数据库名"
var conString = ""

var client = new pg.Client(conString);  //构造一个数据库对象

client.connect(function(error, results) {
	if (error) {
		console.log('ClientConnectionReady Error: ' + error.message);
		client.end();
		return;
	}
	console.log("client.connect OK.\n");
	server.start(client, router.route, handle);  //启动server 
});
// server.start(router.route, handle);