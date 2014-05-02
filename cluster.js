/*
 * Cluster dispatcher
 */
'use strict';
var cluster = require('cluster');
var argv = process.argv;
var queue = null;

if (!argv[2]) {
	console.log('Usage: node cluster app [worker number]');
	return;
}
process.title = argv[2];

var forkQueue = function() {
	// 檢查是否有 queue 處理 module, 命名為 app-queue.js
	var qFile = __dirname + '/' + argv[2].trim() + '-queue.js';
	if (require('fs').existsSync(qFile)) {
		queue = require('child_process').fork(qFile);
		console.log('Queue PID: ' + queue.pid);
		queue.send({ project: argv[2].trim() }); // 可用以設定 message channel or process title
		// 如果有 message 從子程序傳回, 分送給每個 worker
		queue.on('message', function(m) {
			console.log('PARENT got message:', m);
			for (var id in cluster.workers) {
				cluster.workers[id].send(m);
			}
		});
		queue.on('exit', function(code, signal) {
			console.log('queue ' + queue.pid + ' died');
			forkQueue();
		});
	} else {
		console.error(qFile + ' not found, not implement queue function.');
	}
};

//Code to run if we're in the master process
if (cluster.isMaster) {
	process.title += '-master';
	console.log('Master PID: ' + process.pid);

	var numCPUs = require('os').cpus().length;
	var numWorkers = (argv[3] && argv[3] == parseInt(argv[3])) ? argv[3] : numCPUs; // 判斷參數存在及是否為整數
	numWorkers = (numWorkers > numCPUs) ? numCPUs : numWorkers;  
	// Create a worker
	for (var i = 0; i < numWorkers; i++) {
		cluster.fork();
	}
	// Listen for dying workers
	cluster.on('exit', function (worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
		cluster.fork();
	});

	forkQueue();

// Code to run if we're in a worker process
} else {
	process.title += '-worker';
	console.log('Worker PID: ' + process.pid);
	require(__dirname + '/' + argv[2]);
}
