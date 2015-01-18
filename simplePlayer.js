//file Module
var fs = require('fs');

//render Module
var Renderer = require('./node_modules/renderModule.js');

//serial communication
//var SerialPort = require("serialport").SerialPort;
var DMX = require('dmxhost');



//-----------OPTIONS--------------------------------

//player speed
var fps = 50;

//create a socket based webserver to show arduino output
var enableWebInterface = true;


if(process.argv[2]=="start"){
	console.log("start playing")
	var playerPaused=false;
}
else{
	console.log("pausing player")
	var playerPaused=true;
}

/* Windows
	//dmx device
	DMX.device = "\\.\COM6";
	DMX.relayPath="./node_modules/dmxhost.js/dmxhost-serial-relay.py";
	DMX.log=true;
*/

// DMX
DMX.log = true;
DMX.device = '/dev/ttyACM0';
DMX.relayPath = './node_modules/dmxhost/dmxhost-serial-relay.py';

//----------------------------------------------------



var DMXManager=function(){
	//initialize and configure DMX Module
	this.initialize=function(){
		
		DMX.spawn( null, function( error ){
			if ( error ){
				console.log("--------DMX BRIDGE COULD NOT BE INITIALIZED -----------");
				console.log( "Error:", error );
				console.log("-------------------------------------------------------");
				return;
			}
		});
	};
	
	//send data
	//data should be array with 4*16 bytes
	this.send=function(frame){
		var allcolorsSerialized=[];
		for(var i =0; i<frame.length;i++){
			allcolorsSerialized.push(frame[i][0]);
			allcolorsSerialized.push(frame[i][1]);
			allcolorsSerialized.push(frame[i][2]);					
		}
		
		var allcolorsSerializedRGBW=[];
		for(var i=0; i<frame.length;i++){
			allcolorsSerializedRGBW.push(frame[i][0]);
			allcolorsSerializedRGBW.push(frame[i][1]);
			allcolorsSerializedRGBW.push(frame[i][2]);		
			allcolorsSerializedRGBW.push(0);
		}
		
		if(enableWebInterface){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', allcolorsSerialized);
			
		}	

		DMX.ready() && DMX.send( {data: allcolorsSerializedRGBW} );
	}; 
};

var FileManagerObj = function(){
	var that=this;
	var blendingScene=[];
	var scenedirectory="simplePlayer/simpleplayer_scenes/";
	var defaultblendingscene=[{"duration":1000,"type":1,"windows":[{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]},{"color":[0,0,0]}]}];
	
	
	//returns blendingscene, if param frame is set function returns blending scene with correct framecount
	this.getBlendingScene=function(frames){
		if(!frames)
			return blendingScene;
		else{
			newBlendingScene=[];
			for(var i=0;i<frames;i++){
				newBlendingScene.push(blendingScene[i%blendingScene.length]);
			}
			return newBlendingScene;
		}
	};
	this.getOrderedSceneList=function(){
		var fileNames=[];
		var files = fs.readdirSync(scenedirectory);
		
		if(!files||files.length === 0){
			console.log("no files in directory or failed to load");
			return;
		}
		
		for (var i in files) {
			if(/^(\d+_)/.test(files[i]))
				fileNames.push(files[i]);
		}
		fileNames.sort(); 
		
		console.log("files in scene directory:");
		console.log(fileNames);
		
		return fileNames;
	};

	this.loadSceneData=function(sceneName,callback) {	
		//load file 
		fs.readFile(scenedirectory+sceneName, "utf-8", function (err,result) {
			var sceneData=[];
			if (err){
				console.log("could not load scene:"+sceneName);
				console.log("error: "+err);
				
			}
			else{
				//transform scene from fronted json format to simple array with all frames
				sceneData=myRenderer.parse(JSON.parse(result));	
			}
			callback(sceneData);
		});
	};
	
	//initial loading of blending animation
	this.loadBlendingScene=function(frameCount,callback){
		fs.readFile(scenedirectory+'_blendingscene', "utf-8", function (err,result) {
			if (err){
				console.log("there is no blendingSceneFile to load");
				console.log(err);
				blendingScene=myRenderer.parse(defaultblendingscene);
			}
			else{
				blendingScene=myRenderer.parse(JSON.parse(result));
			}
			if(callback)
				callback(that.getBlendingScene(frameCount));
		});
	};	
};

var PlayerObj = function(fps,fileManager,playerPaused){

	var that=this;
	var scenelist=[];
	var currentSceneNumber=0;
	
	var pausing=playerPaused;
	
	var currentScene=[];
	var nextScene=[];
	var blendingScene=[];
	
	var blendingSceneLengthInSeconds=2;
	
	var currentSceneFrameNumber=0;
	var currentsceneType="";
	
	this.start=function(){
		//load the blending scene data
		scenelist=fileManager.getOrderedSceneList();
		fileManager.loadBlendingScene(fps*blendingSceneLengthInSeconds, function(scenedata){
			blendingScene=scenedata;
		});
		//interval to send  frames  to arduino
		setInterval(that.playerTick,1000/fps);
	};
	
	this.pause=function(){
		pausing=true;
	}
	this.play=function(){
		pausing=false;
	}	
	
	this.restart=function(){
		console.log("restart");
		currentSceneNumber=0;
		currentSceneFrameNumber=0;
		currentScene=[];
	}
	this.previous=function(){
		console.log("previous");
		currentSceneNumber=((currentSceneNumber-2)+scenelist.length)%scenelist.length;
		currentSceneFrameNumber=0;
		currentScene=[];
		currentsceneType="";
	}
	this.next=function(){
		console.log("next");
		currentSceneFrameNumber=0;
		currentScene=[];
		currentsceneType="";
	}
	this.goToScenNr=function(sceneNumber){
		currentSceneNumber=sceneNumber;
		currentSceneFrameNumber=0;
		currentScene=[];
		currentsceneType="";
	}
	
	
	this.loadNextScene=function(){
		//if the current scene endet and was of type blendingscene load a sheduled or a ranked scene
		if(currentsceneType=="blendingScene"){
			currentsceneType="normalScene";
			currentScene=nextScene;
			console.log("play scene "+scenelist[currentSceneNumber]+" for "+currentScene.length/fps+" seconds");
			if(enableWebInterface)
				app.io.broadcast('newSceneInfo', "scene "+scenelist[currentSceneNumber]+" ("+currentScene.length/fps+"s)");
			currentSceneNumber=(currentSceneNumber+1)%scenelist.length;
		}
		//if the current scene endet and was of type rankedScene, sheduledscene or undefined then try to find the next scene and add a blendingscene until loading is done
		else if(currentsceneType=="normalScene"||currentsceneType === ""){	
			//tell filemanager to load next scene
			if(scenelist[currentSceneNumber]){
				fileManager.loadSceneData(scenelist[currentSceneNumber],function(sceneData){
					nextScene=sceneData;
				});
			}
			else
				console.log("no scenename to load");
			
			console.log("play blendingscene for "+blendingScene.length/fps+" seconds")
			
			if(enableWebInterface)
				app.io.broadcast('newSceneInfo', "blendingscene ("+blendingScene.length/fps+"s)");
			
			currentsceneType="blendingScene";
			currentScene=blendingScene;
		}
	};

	//player loop
	this.playerTick=function(){
		//if currentscene is not empty play that scene
		if(currentScene.length>0){		
		
			//if this is the last frame of the scene load e new one and play the blending scene
			if(currentSceneFrameNumber==currentScene.length){
				that.loadNextScene();
				currentSceneFrameNumber=0;
			}
			else{
				if(currentScene[currentSceneFrameNumber]){
					//send frame to arduino with dmx bridge
					//console.log("------------ send Frame ----------------");
					//console.log(currentScene[currentSceneFrameNumber]);
					dmxManager.send(currentScene[currentSceneFrameNumber]);
					if(enableWebInterface)
						app.io.broadcast('percent', currentSceneFrameNumber/currentScene.length);
					
				}
				else{
					console.log("this frame does not exist in current scene");
				}
				if(!pausing)
					currentSceneFrameNumber++;
			}
		}
		else{
			//if there is no currentscene try to load one
			that.loadNextScene();
		}
	};
};

//create new Renderer 
var myRenderer = new Renderer(fps);

//initialize dmx serial manager
var dmxManager=new DMXManager();
dmxManager.initialize();

//initialize fileManager
var fileManager=new FileManagerObj(fps);

//initialize player
var player=new PlayerObj(fps,fileManager,playerPaused);
player.start();



if(enableWebInterface){
	//socket io for debugging and testing interface (tower simulation)
	var express = require('express.io');
	var app = express();
	//open socket
	app.http().io();
	app.use(express.static(__dirname + '/simplePlayer/simplePlayer_interface'));
	
	
	app.io.route('play', function(req) {
		player.play();
	})
	app.io.route('pause', function(req) {
		player.pause();
	})
	app.io.route('restart', function(req) {
		player.restart();
	})
	app.io.route('next', function(req) {
		player.next();
	})
	app.io.route('previous', function(req) {
		player.previous();
	})	
	
	app.io.route('hi', function(req) {
		req.io.emit('sceneList', fileManager.getOrderedSceneList())
	})		
	app.io.route('goto', function(req) {
		sceneNumber=parseInt(req.data[0]);
		console.log("goto scene "+sceneNumber)
		player.goToScenNr(sceneNumber);
	})	
	
	
	var server = app.listen(3001, function () {
		var host = server.address().address;
		var port = server.address().port;
		console.log('tower app listening at http://%s:%s', host, port);
	});
}
