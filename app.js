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
var frameRate=1;
var currentFrameId=0;
var intervall;

// get new data
app.io.route('data', function(req) {
	frameData=req.data;
	console.log("new frameData")		
})

var reStartInterval=function(){
	clearInterval(intervall);
	currentFrameId=0;
	intervall= setInterval(function(){
		if(frameData.length>0){
			sendFrameToArduino(currentFrameId);
			currentFrameId=(currentFrameId+1)%frameData.length;
		}
	}, 1000/frameRate); 
}

// get new framerate
app.io.route('frameRate', function(req) {
    console.log("new frameRate")	
	frameRate=req.data;
	reStartInterval();
})

var sendFrameToArduino=function(frameId){
	var messageString="";
	for(var i =0; i<frameData[frameId].length;i++){
		messageString+=frameData[frameId][i][0]+",";  	//r
		messageString+=frameData[frameId][i][1]+",";	//g
		messageString+=frameData[frameId][i][2];	//b
		if(frameData[frameId].length>i+1)messageString+="|"
	}
	console.log(messageString)
	var message = new Buffer(messageString);
	
	
	var client = dgram.createSocket("udp4");
	client.send(message, 0, message.length, 8888, "192.168.2.20", function(err, bytes) {
	  client.close();
	});
}

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
