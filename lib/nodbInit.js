var pg = require('pg'),
	parser = require('./parseIni.js');

module.exports.initNodb = function(iniPath, callback) {
	var conf = parser.parseIni(confPath);
}