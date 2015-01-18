// load file module
var fs = require('fs');

// module for synchronization of user content
var gitsync = require('gitsync');
gitsync.directory = 'savedAnimations/';
gitsync.remote = 'git://neuesvomlicht.de/sync';
gitsync.branch = 'animations';

// load Render Module
var Renderer = require('./node_modules/renderModule.js');

// load DMX serial communication module
//var DMX = require('./node_modules/dmxhost.js/dmxhost.js');
var DMX = require('dmxhost');

//-----------OPTIONS--------------------------------

/*
//dmx device
DMX.device = "\\.\COM6";
DMX.relayPath="./node_modules/dmxhost.js/dmxhost-serial-relay.py";
DMX.log=true;
*/

DMX.log = true;
DMX.relayPath = './node_modules/dmxhost/dmxhost-serial-relay.py';
DMX.relayResponseTimeout = 10000;

// enable or disable simulation interface with express io
var enableWebInterface = false;

// time between checks for changed scenes [ms]
var sceneCheckInterval = 30 * 1000;

// player speed
var fps = 30;

//----------------------------------------------------



var DMXManager = function() {
    var ready = false;

    //initialize and configure DMX Module
    this.initialize = function() {
            DMX.spawn(null, function(error) {
                if (error) {
                    console.log("--------DMX BRIDGE COULD NOT BE INITIALIZED -----------");
                    console.log("Error:", error);
                    console.log("-------------------------------------------------------");
                } else {
                    console.log("Relay spawned.");
                    ready = true;
                }
            });
        };
     //send data
	//data should be array with 4*16 bytes
	var rgbw = new Array(16*4);
	var frameCounter = 0;	
		
    this.send = function(frame) {
		frameCounter++;
		frameCounter=frameCounter % 3;
		
		frame.map( function( rgbWindow, index )
		{
			rgbw[ 4*index + 0 ] = rgbWindow[0];
			rgbw[ 4*index + 1 ] = rgbWindow[1];
			rgbw[ 4*index + 2 ] = rgbWindow[2];
			rgbw[ 4*index + 3 ] = 0;
		});
		if(enableWebInterface && frameCounter == 0){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', rgbw);		
		}

		//DMX.ready() && DMX.send( {data: allcolorsSerializedRGBW} );
		DMX.ready() && DMX.send( {data: rgbw} );
    };
};


var FileManagerObj = function(fps) {
    var that = this;
    var sceneRanking = [];
    var schedule = [];
    var nextScheduledTime = null;
    var nextScheduledSceneName = null;
    var blendingScene = [];

    //returns blendingscene, if param frame is set function returns blending scene with correct framecount
    this.getBlendingScene = function(frames) {
        if (!frames)
            return blendingScene;
        else {
            newBlendingScene = [];
            for (var i = 0; i < frames; i++) {
                newBlendingScene.push(blendingScene[i % blendingScene.length]);
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

    this.scheduleDiffers = function(json1, json2) {
        if (json1.length != json2.length)
            return true;

        for (var i = 0; i < json1.length; i++) {
            if (json1[i].startDate != json2[i].startDate || json1[i].sceneName != json2[i].sceneName || json1[i].endDate != json2[i].endDate || json1[i].repeatEach != json2[i].repeatEach)
                return true;
        }
        return false;
    };

    //return if files differ or not
    this.rankingDiffers = function(json1, json2) {
        if (json1.length != json2.length)
            return true;

        for (var i = 0; i < json1.length; i++) {
            if (json1[i].staticRating != json2[i].staticRating || json1[i].sceneName != json2[i].sceneName)
                return true;
        }
        return false;
    };

    this.loadSchedule = function(callback) {
		fs.readFile('savedAnimations/_schedule', "utf-8", function(err, result) {
			if (err) console.log(err);
			else {
				var newSchedule = JSON.parse(result);

				if (that.scheduleDiffers(schedule, newSchedule)) {
					schedule = newSchedule;
					console.log("----------------------------");
					console.log("--  SCHEDULE GOT UPDATED! --");
					console.log("----------------------------");
				}
				callback();
			}
		});
	};
	
	//loads json object holding scenenames and time [{startTime:DateObj1,sceneName:name1},{startTime:DateObj2,sceneName:name2}]
    this.loadSceneRanking = function() {
        fs.readFile('savedAnimations/_sceneRanking', "utf-8", function(err, result) {
            if (err) throw err;

            console.log("loadSceneRanking");
            var newSceneRanking = JSON.parse(result);

            if (that.rankingDiffers(sceneRanking, newSceneRanking)) {
                sceneRanking = newSceneRanking;

                console.log("----------------------------");
                console.log("FILES OR RANKING CHANGED!!!");
                console.log("----------------------------");
            }
        });
    };

    this.loadSceneData = function(sceneName, callback) {
        //load file 
        fs.readFile('savedAnimations/' + sceneName, "utf-8", function(err, result) {
            if (err) {
                console.log("error: " + err);
                //todo: add errorscene
                sceneData = blendingScene;
            } else {
                //transform scene from fronted json format to simple array with all frames
                sceneData = myRenderer.parse(JSON.parse(result));
                callback(sceneData);
            }
            //todo: add default animation if file could not be loaded
        });
    };

    //initial loading of blending animation
    this.loadBlendingScene = function(callback) {
        fs.readFile('savedAnimations/_blendingScene', "utf-8", function(err, result) {
            if (err) throw err;
            blendingScene = myRenderer.parse(JSON.parse(result));
            callback(blendingScene);
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
        fileManager.loadSceneRanking();
        fileManager.loadSchedule(that.setNextScheduledSceneInfo);

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

        var nextSheduledInSeconds;

        //check if there is a time conflict with the next sheduled scene
        //get timespan till next sheduled scene begins
        try {
            if (!nextScheduledSceneInfo) throw "nextScheduledSceneInfo is not defined";
            if (!nextScheduledSceneInfo.nextScheduledTime) throw "nextScheduledTime is not set for sceneinfo";
            nextSheduledInSeconds = (nextScheduledSceneInfo.nextScheduledTime - (new Date()).getTime()) / 1000;
            console.log("the next scheduled scene " + nextScheduledSceneInfo.nextScheduledSceneName + " should start in " + nextSheduledInSeconds + " seconds. Precisely at " + new Date(nextScheduledSceneInfo.nextScheduledTime));

        } catch (err) {
            console.log(err);
            nextSheduledInSeconds = 99999;
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
	var fileManager = new FileManagerObj(fps);

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