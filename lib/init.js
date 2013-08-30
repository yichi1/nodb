/*
	Method: init environment(Parse ini configure)
	params: ini configure's path
	callback: 
*/
// Load internal modules: parseIni
var parser = require('./parseIni.js');

module.exports.nodb = function(confPath, callback) {
	var conf = parser.parseIni(confPath);
	callback(conf);
}

module.exports.iniConf = function iniConf(confPath){
	var conf = parser.parseIni(confPath);
	return conf["common"];
}