var http = require("http");
var url = require("url");

function start(client, route, handle) {
  function onRequest(request, response) {
    var postData = "";
    var pathname = url.parse(request.url).pathname;
    var queryString = url.parse(request.url).query;
    console.log("Request for " + pathname + " received.");

    request.setEncoding("utf8");

    request.addListener("data", function(postDataChunk) {
      postData += postDataChunk;
      console.log("Received POST data chunk '"+
      postDataChunk + "'.");
    });

    request.addListener("end", function() {
      route(client, handle, pathname, response, postData, queryString);
    });

  }

  // 创建http服务器  
  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;