'use strict';

var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');

var httpServer = http.createServer(function (req, res) {
	var uri = url.parse(req.url);
	var location = path.join(__dirname, 'www', uri.pathname);

	fs.open(location, 'r', function(err, fd) {
		if(err) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('404 not found\n');
			res.end();
			return;
		}
		var stat = fs.fstatSync(fd);
		res.writeHead(200, {'Content-Length': stat.size});
		var input = fs.createReadStream(location, {'fd': fd});
		input.on('error', function(err) {
			console.log('oups', err);
		});
		input.pipe(res);
	});
});

var listeningAddress = process.env.IP || '0.0.0.0';
var listeningPort = process.env.PORT || 20096;

httpServer.listen(listeningPort, listeningAddress, function() {
	console.log('benchmark available at http://' + listeningAddress + ':' +  listeningPort + '/index.html');
});
