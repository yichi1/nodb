"use strict"

// Load internal modules
var server = require("./server"),
	router = require("./router"),
	requestHandlers = require("./requestHandlers");

// Definite routes
var handle = {}
handle["/nodb"] = requestHandlers.start;

// Start server
server.start(router.route, handle);
console.log("server.start OK.\n");
