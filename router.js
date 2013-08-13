function route(client, handle, pathname, response, postData,queryString) {
  console.log("About to route a request for " + pathname);
  if (typeof handle[pathname] === 'function') {
    handle[pathname](client, response, queryString, postData);
  } else {
    // console.log("No request handler found for " + pathname);
    // response.writeHead(404, {"Content-Type": "text/plain"});
    // response.write("404 Not found");
    // response.end();
    console.log("No request handler found for " + pathname);
    // refer to http://stackoverflow.com/questions/6084360/node-js-as-a-simple-web-server
    // and need to add some cache mechanism for static files here.
    var path = require("path"),
        fs = require("fs"),
        path = require("path"),
        filename = path.join(process.cwd(), pathname);

    //content = cache.get(filename);
    // content = inMemoryCache.get(filename);
    // if (content !== undefined && content !== null) {
    //   console.log('read cache...')
    //   var headers = {};
    //   //var contentType = contentTypesByExtension[path.extname(filename)];
    //   //if (contentType) headers["Content-Type"] = contentType;
    //   headers["Content-Type"] = "text/javascript";
    //   response.writeHead(200, headers);
    //   response.write(content, "binary");
    //   response.end();
    //   return;
    // }

    var contentTypesByExtension = {
        '.html': "text/html",
        '.css':  "text/css",
        '.js':   "text/javascript"
    };
    path.exists(filename, function(exists) {
      if (!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        console.log("No request handler found for " + filename);
        return;
      }
      if (fs.statSync(filename).isDirectory()) filename += '/index.html';
      fs.readFile(filename, "binary", function(err, file) {
        if (err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        //cache.set(filename, file);
        // if (path.extname(filename) !== '.html') {
        //   inMemoryCache.set(filename, file);
        // }
		var headers = {};
        var contentType = contentTypesByExtension[path.extname(filename)];
        if (contentType) headers["Content-Type"] = contentType;
        response.writeHead(200, headers);
        response.write(file, "binary");
        response.end();
      });
    });
  }
}

exports.route = route;
