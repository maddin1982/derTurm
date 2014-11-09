var express = require('express.io')
var bodyParser = require('body-parser')
var dgram = require("dgram");

var udpServer = dgram.createSocket("udp4");

var app = express()
app.http().io()

//directory of frontend files
app.use(express.static(__dirname + '/tower'));

//data Variables
var frameData=[];
var frameRate=[];


// get new data
app.io.route('data', function(req) {
	frameData=req.data;
	console.log("new frameData")
	sendFrameToArduino(0);
})

// get new framerate
app.io.route('frameRate', function(req) {
    frameRate=req.data;
})

var sendFrameToArduino=function(frameId){
	var message="";
	for(var i =0; i<frameData[frameId].length;i++){
		message+=frameData[frameId].color;
		if(frameData[frameId].length>i+1)message+="|"
	}
	var message = new Buffer("Some bytes");
	var client = dgram.createSocket("udp4");
	client.send(message, 0, message.length, 41234, "localhost", function(err, bytes) {
	  client.close();
	});
}

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
