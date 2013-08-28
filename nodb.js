"use strict"

// NODB = {};
var confPath = './ini/hn03.ini';
    
// Load internal modules
var server = require("./server"),
	router = require("./router"),
	requestHandlers = require("./requestHandlers"),
	init = require("./lib/init.js");

// Definite routes
var handle = {}
handle["/nodb"] = requestHandlers.start;
handle["/poolno"] = requestHandlers.poolno;
handle["/poolyes"] = requestHandlers.poolyes;

init.nodb(confPath, function(conf){

	global.ini = conf;
	// Start server
	server.start(router.route, handle);
	console.log("server.start OK.\n");
});
