//file operations
var fs = require('fs');

//load Render Module
var Renderer = require('./node_modules/renderModule.js');

//serial communication
//var SerialPort = require("serialport").SerialPort;
var DMX = require('./node_modules/dmxhost.js/dmxhost.js');

//-----------OPTIONS--------------------------------

//player speed
var fps = 20;

//create a socket based webserver to show arduino output
var enableSimulation = true;

//dmx device
var dmxDevice="COM6"


//----------------------------------------------------

var DMXManager=function(){
	var ready =false;

	//initialize and configure DMX Module
	this.initialize=function(){
		//DMX.log = true;
		DMX.device = dmxDevice;
		
		DMX.spawn( null, function( error ){
			if ( error ){
				console.log("--------DMX BRIDGE COULD NOT BE INITIALIZED -----------");
				console.log( "Error:", error );
				console.log("-------------------------------------------------------");
				return;
			}
			else{
				console.log( "Relay spawned." );
				ready=true;
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
		
		if(enableSimulation){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', allcolorsSerialized);
		}	

		if(ready){
			DMX.send( {data: allcolorsSerializedRGBW}, function ( error )
			{
				error && console.log( "Error:", error);
			});
		}
	}; 
};

var FileManagerObj = function(){
	var that=this;
	var blendingScene=[];
	var scenedirectory="simplePlayer/simpleplayer_scenes/";
	var defaultblendingscene=[{"duration":1000,"type":1,"windows":[{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]},{"color":[223,223,0]}]}];
	
	
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
			if(/\d+_\w+/.test(files[i]))
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

var PlayerObj = function(fps,fileManager){

	var that=this;
	var scenelist=[];
	var currentSceneNumber=0;
	
	var pausing=true;
	
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
	}
	
	this.loadNextScene=function(){
		//if the current scene endet and was of type blendingscene load a sheduled or a ranked scene
		if(currentsceneType=="blendingScene"){
			currentsceneType="normalScene";
			currentScene=nextScene;
			console.log("play scene "+scenelist[currentSceneNumber]+" for "+currentScene.length/fps+" seconds");
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
var player=new PlayerObj(fps,fileManager);
player.start();



if(enableSimulation){
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
	
	var server = app.listen(3001, function () {
		var host = server.address().address;
		var port = server.address().port;
		console.log('tower app listening at http://%s:%s', host, port);
	});
	

	
}
