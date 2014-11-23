var express = require('express.io')

//file operations
var fs = require('fs');

//udp communication
var dgram = require("dgram");
var udpServer = dgram.createSocket("udp4");

//serial communication
var SerialPort = require("serialport").SerialPort;
var serialport = new SerialPort("COM6", {
    baudrate: 115200
},false);
openSerialPort();

var app = express()

//open socket
app.http().io()

//directory of frontend files
app.use(express.static(__dirname + '/tower'));

//frames data
var frameData=[];
//id of current frame
var currentFrameId=0;

var frameAnimationRunning=false;
//save last send message to avoid sending if nothing has changed
var lastMessageSendToArduino="";


// get new data
app.io.route('showInModel', function(req) {
	frameData=req.data;
	// send data over serial port 
	startAnimation();
})

//save scene to file
app.io.route('saveSceneToFile', function(req) {
	//save to file
	if(req.data.fileName==""){
		var date=new Date();
		filename=date.getDate()+"_"+(date.getMonth()+1)+"_"+date.getFullYear()+"_"+date.getHours()+"-"+date.getMinutes()+"-"+date.getSeconds();
	}
	else
		filename=req.data.fileName;
	
	fs.writeFile('savedAnimations/'+filename, JSON.stringify(req.data.frameData), function (err) {
	  if (err) throw err;
	  console.log('It\'s saved!');
	});
})

app.io.route('getSavedScenes', function(req) {
	var scenes = fs.readdirSync('savedAnimations/');
	req.io.emit('savedScenesLoaded', scenes)
})

app.io.route('getSceneData', function(req) {
	fs.readFile('savedAnimations/'+req.data, "utf-8", function (err, data) {
	  if (err) throw err;
	  req.io.emit('sceneDataLoaded', data)
	});
})

function openSerialPort(){
 console.log('openSerialPort');
 
 //SHOW ALL PORTS
 // var SerialPortObj = require("serialport");
 // SerialPortObj.list(function (err, ports) {
  // ports.forEach(function(port) {
    // console.log(port.comName);
    // console.log(port.pnpId);
    // console.log(port.manufacturer);
  // });
  // })
  
	 serialport.open(function (error) {
	  if ( error ) {
		console.log('failed to open: '+error);
	  } else {
		console.log('open');
		// serialPort.on('data', function(data) {
		  // console.log('data received: ' + data);
		// });
	
	  }
	})
}

function writeSerialMessage(colorArray){
	serialport.write(colorArray, function(err, results) {
		  //console.log('results ' + results);
	});
}

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

var sendFrameToArduino=function(frameId){
	
	/* 
	//UDP Messages 
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
	*/
	
	var allcolorsSerialized=[];
	for(var i =0; i<frameData[frameId].windows.length;i++){
		allcolorsSerialized.push(frameData[frameId].windows[i][0])
		allcolorsSerialized.push(frameData[frameId].windows[i][1])
		allcolorsSerialized.push(frameData[frameId].windows[i][2])
	}
	//Serial Messages
	writeSerialMessage(allcolorsSerialized)
}

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
