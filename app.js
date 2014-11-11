var express = require('express.io')
var bodyParser = require('body-parser')
var dgram = require("dgram");

var udpServer = dgram.createSocket("udp4");

var lastMessageSendToArduino="";

var app = express()
app.http().io()

//directory of frontend files
app.use(express.static(__dirname + '/tower'));

//data Variables
var frameData=[];
var currentFrameId=0;
var frameAnimationRunning=false;

// get new data
app.io.route('data', function(req) {
	frameData=req.data;
	console.log("new frameData")	
	startAnimation();
})

//go to next Frame if there is one
function goToNextFrame(){
	if(frameData.length>1){
		setTimeout(function () {goToNextFrame()},frameData[currentFrameId].duration)
		
		sendFrameToArduino(currentFrameId)
		currentFrameId=(currentFrameId+1)%frameData.length;
	}
	else //animation stoped
		frameAnimationRunning=false;
}

//start framechange with timer if it isnt already running
function startAnimation(){
	if(!frameAnimationRunning&&frameData.length>1){
		goToNextFrame()
		frameAnimationRunning=true;
	}
}

// var reStartInterval=function(){
	// clearInterval(intervall);
	// currentFrameId=0;
	// intervall= setInterval(function(){
		// if(frameData.length>0){
			// sendFrameToArduino(currentFrameId);
			// currentFrameId=(currentFrameId+1)%frameData.length;
		// }
	// }, 1000/frameRate); 
// }

// get new framerate
// app.io.route('frameRate', function(req) {
    // console.log("new frameRate")	
	// frameRate=req.data;
	// reStartInterval();
// })

var sendFrameToArduino=function(frameId){
	var messageString="";
	for(var i =0; i<frameData[frameId].windows.length;i++){
		messageString+=frameData[frameId].windows[i][0]+",";  	//r
		messageString+=frameData[frameId].windows[i][1]+",";	//g
		messageString+=frameData[frameId].windows[i][2];	//b
		if(frameData[frameId].windows.length>i+1)messageString+="|"
	}
	//console.log(messageString)
	var message = new Buffer(messageString);
	var client = dgram.createSocket("udp4");
	//console.log(messageString)
	if(lastMessageSendToArduino!=messageString){
		client.send(message, 0, message.length, 8888, "192.168.2.20", function(err, bytes) {
		  client.close();
		});
	}
	lastMessageSendToArduino=messageString;
}

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
