"use strict"
var conf = './ini/hn03.ini',//configure file
	parser = require('./lib/parseIni.js'),
	pg = require('pg'),
	conf = parser.parseIni(conf);

// 加载内部模块
var server = require("./server"),
	router = require("./router"),
	requestHandlers = require("./requestHandlers");

//将url路径对应到相应的函数  
var handle = {}
handle["/nodb"] = requestHandlers.start;

var common = conf["common"];
if (common["rdb type"] == 'pg') {
	//构造连接数据库的连接字符串："tcp://用户名:密码@ip/相应的数据库名"
    var conString = 'pg://' + 
                common["rdb user"] + ':' + 
                common["rdb pass"] + '@' + 
                common["rdb addr"] + ':'+ 
                common["rdb port"] + '/' + 
                common["rdb dbname"];

    // pg method initialString?
    pg.connect(conString, function(error, client, done) {
		if (error) {
			console.log('ClientConnectionReady Error: ' + error.message);
			client.end();
			return;
		}
		console.log("client.connect OK.\n");
		server.start(client, router.route, handle);  //启动server

		// client.query('SELECT name FROM users WHERE email = $1', ['brian@example.com'], function(err, result) {
		//     // assert.equal('brianc', result.rows[0].name);
		//     done();
		// });
	});
	// server.start(router.route, handle);
}

