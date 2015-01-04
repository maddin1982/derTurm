
var enableSimulation=true;

if(enableSimulation){
	//socket io for debugging and testing interface (tower simulation)
	var express = require('express.io')
	var app = express();
	//open socket
	app.http().io()
	app.use(express.static(__dirname + '/towerSimulation'));
	
	var server = app.listen(3001, function () {
	  var host = server.address().address
	  var port = server.address().port
	  console.log('tower app listening at http://%s:%s', host, port)
	})
}

//file operations
var fs = require('fs');

//load Render Module
var Renderer=require('./renderModule.js');

//serial communication
var SerialPort = require("serialport").SerialPort;

var fps=24;

//create new Renderer with 24 Frames
var myRenderer=new Renderer(fps);

var SerialManagerObj =function(){
	var that=this;
	var serialport;
	var serialPortReady=false;
	
	this.openSerialport=function(){
		serialport = new SerialPort("COM6", {
			baudrate: 115200,
			dataBits: 8,
			parity: 'none',
			stopBits: 1,
			flowControl: false 
			},false);
		
		serialport.open(function (error) {
			if ( error ) {
				console.log('failed to open: '+error);
			} else {
				serialPortReady=true;
				console.log('open');
				serialport.on('data', function(data) {
					console.log(data)
				});
			}
		})
	}
	
	this.sendFrame=function(frame){
		var allcolorsSerialized=[];
		for(var i =0; i<frame.length;i++){
			allcolorsSerialized.push(frame[i][0])
			allcolorsSerialized.push(frame[i][1])
			allcolorsSerialized.push(frame[i][2])
		}
		if(enableSimulation){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', allcolorsSerialized)
		}

		if(serialPortReady){
			//Serial Messages
			var buffer = new Buffer(allcolorsSerialized);
			
			if(!serialport)
				throw "serialPort not initialized";
				
			serialport.write(buffer, function(err, results) {
				if(err) throw('err ' + err)
			});
		}
	}
	
	this.showSerialPorts=function(){
		//SHOW ALL PORTS
		var SerialPortObj = require("serialport");
		SerialPortObj.list(function (err, ports) {
			ports.forEach(function(port) {
				console.log(port.comName);
				console.log(port.pnpId);
				console.log(port.manufacturer);
			});
		})
	}
}

var FileManagerObj = function(){
	var that=this;
	
	var sceneData=[];
	var sceneRanking=[];
	
	var schedule=[];
	var b_scheduledSceneNext=false;
	var nextScheduledTime=null;
	var nextScheduledSceneName=null;

	var newSceneAvailable=false;
	var blendingScene=[];
	
	this.isNextSceneScheduled=function()
	{
		return b_scheduledSceneNext;
	}
	this.getBlendingScene=function(){
		return blendingScene;
	}
	
	this.isNewSceneDataAvailable=function(){
		return newSceneAvailable;
	}
	
	this.getNewSceneData=function(){
		newSceneAvailable=false;
		return sceneData;
	}

	this.getNextSceneNameByRanking=function(){
		var highestRanking=0;
		var highestRankedScene;

		for(var i =0;i<sceneRanking.length;i++){
			//add or increase currentrating
			if(!sceneRanking[i].currentRating)
				sceneRanking[i].currentRating=sceneRanking[i].dynamicRating;
			else{
				sceneRanking[i].currentRating+=sceneRanking[i].dynamicRating;
			}		
			//find scene with highest current rating value
			if(parseInt(sceneRanking[i].currentRating)>=highestRanking){
				highestRanking=sceneRanking[i].currentRating;
				highestRankedScene=sceneRanking[i];
			}	
		}
		//reset currentrating of highest ranked scene
		highestRankedScene.currentRating=0;
		highestRankedScene.dynamicRating=highestRankedScene.dynamicRating>highestRankedScene.staticRating?(highestRankedScene.dynamicRating-1):highestRankedScene.staticRating;
		
		that.loadSceneData(highestRankedScene);
	}
	
	this.computeNextScheduledScene=function(){
		var current = (new Date).getTime();	
		var closestTime=current;
		//for each schedule entry 
		for(var i =0;i<schedule.length;i++){
			// check if it is currently before the endDate
			if(current < schedule[i].endDate)
			{
				//find the closest start time to now
				var tmp = schedule[i].startDate;
				while ( tmp < current )
				{
					tmp+=schedule[i].repeatEach
				}	
				//found new closest Schedule
				if((tmp-current) < closestTime)	
				{
					closestTime = (tmp-current);
					nextScheduledTime = tmp;
					nextScheduledSceneName = schedule[i].sceneName;					
				}
			}			
		}
		console.log("Play Scene: "+ nextScheduledSceneName +" in "+(closestTime)/1000+ "seconds. Precisely at "+new Date(nextScheduledTime));		
	}

	this.scheduleDiffers=function(json1,json2){
		if(json1.length!=json2.length)
			return true;
		
		for(var i =0;i<json1.length;i++){
			if(json1[i].startDate!=json2[i].startDate||json1[i].sceneName!=json2[i].sceneName||json1[i].endDate!=json2[i].endDate||json1[i].repeatEach!=json2[i].repeatEach)	
				return true;
		}
		return false;
	}

	//return if files differ or not
	this.rankingDiffers=function(json1,json2){
		if(json1.length!=json2.length)
			return true;
		
		for(var i =0;i<json1.length;i++){
			if(json1[i].staticRating!=json2[i].staticRating||json1[i].sceneName!=json2[i].sceneName)	
				return true;
		}
		return false;
	}
	this.loadSchedule=function(){
		fs.readFile('savedAnimations/_schedule', "utf-8", function (err, result) {
			if (err) throw err;
			  
			var newSchedule=JSON.parse(result);
			
			if(that.scheduleDiffers(schedule,newSchedule)){
				schedule=newSchedule;
				that.computeNextScheduledScene();
				console.log("----------------------------")
				console.log("--  SCHEDULE GOT UPDATED! --")
				console.log("----------------------------")				
			}	
		});
	}
	//loads json object holding scenenames and time [{startTime:DateObj1,sceneName:name1},{startTime:DateObj2,sceneName:name2}]
	this.loadSceneRanking=function(){
		
		fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, result) {
			if (err) throw err;
			  
			var newSceneRanking=JSON.parse(result);
			
			if(that.rankingDiffers(sceneRanking,newSceneRanking)){
				sceneRanking=newSceneRanking;
				that.getNextSceneNameByRanking();
				console.log("----------------------------")
				console.log("FILES OR RANKING CHANGED!!!")
				console.log("----------------------------")
			}	
		});
	}

	this.createBlendingSceneWith=function(inFrames) {
		var tmpData=blendingScene.slice();
		//console.log("The sceneData has "+sceneData.length+" frames.");
		//console.log ("But we need  "+ neededFrameCount+ " frames.");
		if (inFrames <= sceneData.length)
		{
			var remove = tmpData.length-inFrames;
			tmpData.splice(remove*-1,remove);
		}
		else
		{	while ( tmpData.length < inFrames)
			{
				tmpData.push(tmpData[0]);
			}
		}
		return tmpData;
	}

	this.loadSceneData=function(sceneInfo) {
		sceneName=sceneInfo.sceneName;
		//there was a waiting period and now the scheduled scene should start
		if (b_scheduledSceneNext)
		{
			b_scheduledSceneNext=false;
			sceneName = nextScheduledSceneName;
			// how much delay?
			console.log("delay: "+((new Date).getTime()-nextScheduledTime));
		}
		fs.readFile('savedAnimations/'+sceneName, "utf-8", function (err, result) {
			if (err){
				console.log("error: "+err);
				//todo: add errorscene
				sceneData=blendingScene;
				
			}
			else{
				sceneData=myRenderer.parse(JSON.parse(result));
				
				console.log("next Scene will be: "+sceneName+", the rating values are d/s:"+sceneInfo.dynamicRating+"/"+sceneInfo.staticRating);
				console.log("this scene is:"+Math.floor(sceneData.length/24,2)+" seconds long");
				/*var diff = (nextScheduledTime-(new Date).getTime())/1000;
				console.log(nextScheduledTime+" the next scheduled scene should start in "+diff+ " seconds");
				
				//when there is too little time to show that Scene
				if( diff < ((sceneData.length/24)+2.0)) //+ 2seconds offset 
				{
					//set flag for scheduled animation!
					b_scheduledSceneNext = true;
					//fill the time with just the right amount of Frames
					var neededFrameCount = parseInt(24*diff);
					sceneData = that.createBlendingSceneWith(neededFrameCount);
				}*/
			}
			newSceneAvailable=true;
			//todo: add default animation if file could not be loaded
		});
	}
	this.loadBlendingScene=function(){
		fs.readFile('savedAnimations/_blendingScene', "utf-8", function (err, result) {
			if (err) throw err;
			blendingScene=myRenderer.parse(JSON.parse(result));
		});
	}	
}

var PlayerObj = function(fps,fileManager,serialManager){
	var fps=fps;
	var that=this;
	var currentScene=[];
	var nextScene=[];
	var currentSceneFrameNumber=0;
	
	this.start=function(){
		//check  if new scene is available
		setInterval(that.checkForNewScenes,5000);
		
		//send fps frames per second to arduino
		setInterval(that.playerTick,1000/fps);
	}
	
	//check if new scenedata is available
	this.checkForNewScenes=function(){
		console.log("checkForNewScenes")
		fileManager.loadSceneRanking();
		fileManager.loadSchedule();
	}

	this.playerTick=function(){
		if(currentScene.length>0){		
			
			//if last frame of scene
			if(currentScene.length==currentSceneFrameNumber){
				currentScene=[];

				//if new scene is available
				if(fileManager.isNewSceneDataAvailable()){
					//get next scene from filemanager
					nextScene=fileManager.getNewSceneData();
				}
				else{
					//request new scene by ranking in filemanager
					fileManager.getNextSceneNameByRanking();
					fileManager.computeNextScheduledScene();
					//set blending scene as next scene					
					nextScene=fileManager.getBlendingScene();
				}
			}
			else{
				//send frame to arduino
				serialManager.sendFrame(currentScene[currentSceneFrameNumber]);	
				currentSceneFrameNumber++;
			}
		}
		//when currentscene ended or no currentscene is available try to load next scene
		else{
			if(nextScene.length>0){					
				currentScene=nextScene;
				currentSceneFrameNumber=0;
			}
			//initial loading of next scene
			else{
				if(fileManager.isNewSceneDataAvailable()){
					console.log("initial loading")
					nextScene=fileManager.getNewSceneData();
				}
			}
		}
	}
}

var serialManager=new SerialManagerObj();
var fileManager=new FileManagerObj();
fileManager.loadBlendingScene();

serialManager.openSerialport();

var player=new PlayerObj(fps,fileManager,serialManager);

player.start();
