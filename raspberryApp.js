// load file module
var fs = require('fs');

// load Render Module
var Renderer = require('./node_modules/renderModule.js');

// module for synchronization of user content
var gitsync = require('gitsync');

// load DMX serial communication module
var DMX = require('dmxhost');

//-----------OPTIONS--------------------------------

gitsync.directory = 'savedAnimations/';
gitsync.remote = 'git://neuesvomlicht.de:4880/sync.git';
gitsync.branch = 'animations';

DMX.log = true;
DMX.relayPath = './node_modules/dmxhost/dmxhost-serial-relay.py';
DMX.relayResponseTimeout = 10000;

// enable or disable simulation interface with express io
var enableWebInterface = false;

// time between checks for changed scenes [ms]
var sceneCheckInterval = 30 * 1000;

//default blending scene 4s black
var defaultBlendingScene=[{"duration":4000,"type":1,"windows":[{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1},{"color":[0,0,0],"active":1}]}];
var scenePath="savedAnimations/";	

// player speed
var fps = 30;

//----------------------------------------------------

var DMXManager = function() {

    //initialize and configure DMX Module
    this.initialize = function() {
            DMX.spawn(null, function(error) {
                if (error) {
                    console.log("--------DMX BRIDGE COULD NOT BE INITIALIZED -----------");
                    console.log("Error:", error);
                    console.log("-------------------------------------------------------");
                } else {
                    console.log("Relay spawned.");
                }
            });
        };
 
	//data should be array with 4*16 bytes
	var rgbw = new Array(16*4);
	
	var frameCounter = 0;	
		
    this.send = function(frame) {
	
		//fill rgb array
		frame.map( function( rgbWindow, index )
		{
			rgbw[ 4*index + 0 ] = rgbWindow[0];
			rgbw[ 4*index + 1 ] = rgbWindow[1];
			rgbw[ 4*index + 2 ] = rgbWindow[2];
			rgbw[ 4*index + 3 ] = 0;
		});
		
		//update web interface every 3 frames
		frameCounter++;
		frameCounter=frameCounter % 3;
		if(enableWebInterface && frameCounter == 0){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', rgbw);		
		}

		DMX.ready() && DMX.send( {data: rgbw} );
    };
};

var SceneManagerObj =function(fileManager){

	var that = this;
	var sceneRankingData,scheduleData;
	var sceneRankingFilename="_schedule";
	var scheduleFileName="_schedule";

	//next sheduled file data
    var nextScheduledTime, nextScheduledSceneName;
	
	var setScheneRankingData=function(data){
		sceneRankingData=data;
	}
	var setscheduleData=function(data){
		scheduleData=data;
	}	
	
	//load blending, sceneranking and shedule
	this.initialize = function(){
		
		
		
	}
	
    //returns blendingscene, if param frame is set function returns blending scene with correct framecount
    this.getBlendingScene = function(frameCount) {    
		if (!frameCount){
			 //return default length
            return blendingScene;
		}
        else {
			//return a custom scene	
            newBlendingScene = new Array(frameCount);;
			var defaultLength=blendingScene.length;
			
            for (var i = 0; i < frameCount; i++) {
                newBlendingScene[i]=blendingScene[i % defaultLength];
            }
            return newBlendingScene;
        }
    };
	
	this.getNextSceneNameByRanking = function() {
        var highestRanking = 0;
        var highestRankedScene;

        for (var i = 0; i < sceneRanking.length; i++) {
            //check if dynamicRating is below staticRating 
            if (sceneRanking[i].dynamicRating < sceneRanking[i].staticRating)
                sceneRanking[i].dynamicRating = sceneRanking[i].staticRating;

            //add or increase current rating
            if (!sceneRanking[i].currentRating)
                sceneRanking[i].currentRating = sceneRanking[i].dynamicRating;
            else {
                sceneRanking[i].currentRating += sceneRanking[i].dynamicRating;
            }
            //find scene with highest current rating value
            if (parseInt(sceneRanking[i].currentRating) >= highestRanking) {
                highestRanking = sceneRanking[i].currentRating;
                highestRankedScene = sceneRanking[i];
            }

        }
        if (highestRankedScene) {
            //reset currentrating of highest ranked scene
            highestRankedScene.currentRating = 0;
            highestRankedScene.dynamicRating = highestRankedScene.dynamicRating > highestRankedScene.staticRating ? (highestRankedScene.dynamicRating - 1) : highestRankedScene.staticRating;

            console.log("next Scene: --<<" + highestRankedScene.sceneName + ">>--, rating values d/s:" + highestRankedScene.dynamicRating + "/" + highestRankedScene.staticRating);

            return highestRankedScene.sceneName;
        }
    };

    this.getNextScheduledScene = function() {
        var current = (new Date()).getTime();
        var closestTime = current;
        //for each schedule entry 
        for (var i = 0; i < schedule.length; i++) {
            // check if it is currently before the endDate
            if (current < schedule[i].endDate) {
                //find the closest start time to now
                var tmp = schedule[i].startDate;
                while (tmp < current) {
                    tmp += schedule[i].repeatEach;
                }
                //found new closest Schedule
                if ((tmp - current) < closestTime) {

                    closestTime = (tmp - current);
                    nextScheduledTime = tmp;
                    nextScheduledSceneName = schedule[i].sceneName;
                    return {
                        "nextScheduledTime": nextScheduledTime,
                        "nextScheduledSceneName": nextScheduledSceneName
                    };
                }
            }
        }
    };
}

var FileManagerObj = function(scenePath) {
    
	var that = this;
	//keepPreviouslyCachedObjects 
	var rawCache=[];
	
	this.loadFileAndStartWatch(filename, callback){
		that.loadAndParseFile(fileName,function(data){
			callback(data);
			that.watchFileForChanges(fileName,function(data){
				callback(data);
			})
		})
	}

	this.watchFileForChanges(filename, callback){
		fs.watch(fileName, {
		  persistent: true
		}, function(event, filename,callback) {
		   console.log(event + " event occurred on " + filename);
		   that.loadAndParseFile(filename,callback);
		});
	}
	
	this.loadAndParseFile(fileName,callback){
		fs.readFile(scenePath+fileName, "utf-8", function(err, result, callback) {
			if (err){ 
				console.log(fileName+" corrupt or not existent")
				console.log(err);
			}
			else {
				var data;
				try{
					data = JSON.parse(result);
					}catch(e){
						console.log("Error while parsing shedule file contents");
						console.log(e);
				}
				if(data){
					callback(data)
				}
				else{
					console.log("no data could be loaded")
				}
			}
	})
	

    this.loadSceneData = function(sceneName, callback) {
        //load file 
        fs.readFile(scenePath + sceneName, "utf-8", function(err, result) {
            if (err) {
				console.log("Can not load scene "+sceneName+", get default-blendingscene instead");
                console.log("error: " + err);
                //todo: add errorscene
                sceneData = blendingScene;
            } else {
                //transform scene from fronted json format to simple array with all frames
                try{
					sceneData = myRenderer.parse(JSON.parse(result));
                }catch(e){
					console.log("Can not load scene "+sceneName+", load blendingscene instead");
					console.log("error: " + e);
					sceneData = blendingScene;
				}
				callback(sceneData);
            }
        });
    };


};

var PlayerObj = function(fps, fileManager) {

    var that = this;
    var currentScene = [];
    var nextRankedScene = [];
    var nextScheduledScene = [];
    var nextSceneType = "";
    var blendingScene = [];
    var currentSceneFrameNumber = 0;
    var nextScheduledSceneInfo;
    var currentsceneType = "";
    var nextSceneName = "";

    this.start = function() {
        //load the blending scene data
        fileManager.loadBlendingScene(that.setBlendingScene);

        //refresh Schedule and Scenelist
        setInterval(that.checkForNewScenes, sceneCheckInterval);
        // fileManager.loadSceneRanking();
        // fileManager.loadSchedule(that.setNextScheduledSceneInfo);

        //interval to send  frames  to arduino
        setInterval(that.playerTick, 1000 / fps);
    };

    //callback function to set Blendingscene
    this.setBlendingScene = function(sceneData) {
        blendingScene = sceneData;
    };

    this.setCurrentScene = function(sceneData) {
        console.log("loading new scene, duration: " + sceneData.length / fps);
        currentSceneFrameNumber = 0;
        currentScene = sceneData;
    };

    //callback function to set NextScheduledSceneInfo
    this.setNextScheduledSceneInfo = function() {
        //load next sheduled scene information (name and time)
        nextScheduledSceneInfo = fileManager.getNextScheduledScene();
    };

    //refresh Schedule and Scenelist every 5 seconds
    this.checkForNewScenes = function() {
        //console.log("checkForNewScenes")

        // update files from remote repository
        gitsync.pull({
            init: true
        }, function(error) {
            if (!error) {
                // log success
                console.log("Pulled scenes from remote.");
            } else {
                // log error
                console.log("Error pulling scenes from remote:", error);
            }

            // load scenes from files - TODO: move to if ( !error ) bracket in final version
            fileManager.loadSceneRanking();
            fileManager.loadSchedule(that.setNextScheduledSceneInfo);

        });
    };

    this.setNextScene = function(sceneData) {

        //set next scene type to rankedScene as default
        nextRankedScene = sceneData;
        nextSceneType = "rankedScene";

        var nextSheduledInSeconds=99999;

        //check if there is a time conflict with the next sheduled scene
        //get timespan till next sheduled scene begins
        
        if (nextScheduledSceneInfo){
            if (nextScheduledSceneInfo.nextScheduledTime){ 
				nextSheduledInSeconds = (nextScheduledSceneInfo.nextScheduledTime - (new Date()).getTime()) / 1000;
				console.log("the next scheduled scene " + nextScheduledSceneInfo.nextScheduledSceneName + " should start in " + nextSheduledInSeconds + " seconds. Precisely at " + new Date(nextScheduledSceneInfo.nextScheduledTime));
				}
			else
				console.log("nextScheduledTime is not set for sceneinfo");
        } 

        if (nextSheduledInSeconds < ((nextRankedScene.length / fps) + (blendingScene.length / fps))) {
            console.log("nextscene: " + nextRankedScene.length / fps + " s |" + " blending: " + blendingScene.length / fps + " s are to long");
            console.log("create a fitting blendingScene with " + (Math.floor(nextSheduledInSeconds) * fps) + " frames");

            //if there is a conflict create a fitting blending scene to wait for the scheduled scene
            var fittingBlendingScene = fileManager.getBlendingScene(Math.floor(nextSheduledInSeconds) * fps);
            currentsceneType = "blendingScene";
            that.setCurrentScene(fittingBlendingScene);
            if (enableWebInterface)
                app.io.broadcast('newSceneInfo', "blendingscene  (" + fittingBlendingScene.length / fps + "s)");

            //and load the next sheduled scene
            fileManager.loadSceneData(nextScheduledSceneInfo.nextScheduledSceneName, that.setNextScheduledScene);
        } else {
            //set a normal blending scene
            console.log("set currentscene to blendingScene");
            currentsceneType = "blendingScene";
            that.setCurrentScene(blendingScene);
            if (enableWebInterface)
                app.io.broadcast('newSceneInfo', "blendingscene  (" + blendingScene.length / fps + "s)");
        }
    };

    this.setNextScheduledScene = function(sceneData) {
        nextSceneType = "scheduledScene";
        nextScheduledScene = sceneData;
        //search for next sheduled scene
        that.setNextScheduledSceneInfo();
    };

    this.loadNewScene = function() {
        //if the current scene endet and was of type blendingscene load a sheduled or a ranked scene
        if (currentsceneType == "blendingScene") {
            if (nextSceneType == "scheduledScene") {
                console.log("set currentscene to scheduledScene");
                currentsceneType = "scheduledScene";
                that.setCurrentScene(nextScheduledScene);
				if (enableWebInterface)
					app.io.broadcast('newSceneInfo', "scene " + nextSceneName + " (" + nextScheduledScene.length/fps + "s)");
            }
            if (nextSceneType == "rankedScene") {
                console.log("set currentscene to rankedScene");
                currentsceneType = "rankedScene";
                that.setCurrentScene(nextRankedScene);
				if (enableWebInterface)
					app.io.broadcast('newSceneInfo', "scene " + nextSceneName + " (" + nextRankedScene.length/fps + "s)");
            }
        }
        //if the current scene endet and was of type rankedScene, sheduledscene or undefined then try to find the next scene and add a blendingscene until loading is done
        else if (currentsceneType == "rankedScene" || currentsceneType == "scheduledScene" || currentsceneType === "") {
            //get next ranked scene name if sceneranking was loaded

            nextSceneName = fileManager.getNextSceneNameByRanking();
            //load the next ranked scene and check if there is a time conflict with a scheduled scene
            if (nextSceneName) {
                fileManager.loadSceneData(nextSceneName, that.setNextScene);
            }
        }
    };

    this.playerTick = function() {
        if (currentScene.length > 0) {
            //if last frame of scene
            if (currentSceneFrameNumber == currentScene.length) {
                that.loadNewScene();
                currentSceneFrameNumber = 0;
            } else {
                if (currentScene[currentSceneFrameNumber]) {

                    dmxManager.send(currentScene[currentSceneFrameNumber]);
                } else
                    console.log("framerror, possibly with blending scene generation");

                currentSceneFrameNumber++;
            }
        } else {
            that.loadNewScene();
        }
    };
};

//create new Renderer with 24 Frames
var myRenderer = new Renderer(fps);

//initialize dmx serial manager
var dmxManager = new DMXManager();
dmxManager.initialize();

console.log("Wait for dmx bridge for "+DMX.relayResponseTimeout+" ms");
setTimeout( function()
{
	//initialize filemanager
	var fileManager = new FileManagerObj();
    
	
	var scenemanager = new SceneManager(fileManager);
	
	//initialize player
	var player = new PlayerObj(fps, fileManager);
	player.start();

	//create simulation interface 
	if (enableWebInterface) {
		//socket io for debugging and testing interface (tower simulation)
		var express = require('express.io');
		var app = express();
		//open socket
		app.http().io();
		app.use(express.static(__dirname + '/towerSimulation'));

		var server = app.listen(3001, function() {
			var host = server.address().address;
			var port = server.address().port;
			console.log('tower app listening at http://%s:%s', host, port);
		});
	}
}, DMX.relayResponseTimeout );