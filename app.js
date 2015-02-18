var express = require('express.io');

//file operations
var fs = require('fs');

var app = express();

// module for synchronization of user content
var gitsync = require('gitsync');
gitsync.directory = 'savedAnimations/';
gitsync.remote    = '../sync.git/';
gitsync.branch    = 'animations';

//open socket
app.http().io()

//authentication
var auth = express.basicAuth('admin', 'admin');

//return cut-down version of site
app.use('/', express.static(__dirname + '/tower'));

//return content with full option set
app.use('/protected', auth);
app.use('/protected', express.static(__dirname + '/tower'));

//return content with full option set
app.use('/sceneranking', auth);
app.use('/sceneranking', express.static(__dirname + '/scenerankingEditor'));



//todo add other apps
function getSceneRankingItem(sceneName,dynamicRating,staticRating){
	var item={};
	item.sceneName=sceneName;
	item.dynamicRating=dynamicRating;
	item.staticRating=staticRating;
	return item;
}

//todo add other apps
function getScheduleItem(sceneName){
	var item={};
	var d = new Date();
	var milli = d.getTime();

	item.sceneName=sceneName;
	item.startDate=milli;
	item.endDate=milli;
	item.repeatEach=60000;
	return item;
}

//save scene to file
app.io.route('saveSceneToFile', function(req) {
	//save to file; if no filename is set, make one
	if(req.data.fileName==""){
		var date=new Date();
		filename=date.getDate()+"_"+(date.getMonth()+1)+"_"+date.getFullYear()+"_"+date.getHours()+"-"+date.getMinutes()+"-"+date.getSeconds();
	}
	else{
		//prevent shit to happen		
		filename=req.data.fileName;
		console.log(filename)
		filename=filename.replace(/[^\w\s-_!ßäüöÄÜÖ]/g,"");
		console.log(filename)
	}
	//stringify data
	var jsonFile=req.data.frameData;;
	//remove active attribute from all windows
	for(var i=0;i<jsonFile.length;i++){
		for(var j=0;j<jsonFile[i].windows.length;j++){
			delete jsonFile[i].windows[j].active;
		}		
	}

	fs.writeFile('savedAnimations/'+filename, JSON.stringify(jsonFile), function (err) {
	  if (err) throw err;
	  console.log('It\'s saved!');
	});
	
	addFileToSceneRanking(filename);	
	
})

function addFileToSceneRanking(newFileName){

	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
		var sceneRanking=[];
		if(data){
			//add file-data to existing sceneRanking file
			console.log("add file to existing sceneRanking file!")
			sceneRanking=JSON.parse(data);
			//check if sceneName exists and remove it
			for(var i=0;i<sceneRanking.length;i++){
				sceneRanking[i].dynamicRating=sceneRanking[i].dynamicRating-5>1?sceneRanking[i].dynamicRating-5:1;
				if(sceneRanking[i].sceneName==newFileName){
					sceneRanking.splice(i,1);
					i--;
				}
			}
		}
		else{	
			//write new sceneRanking File
			var fileNames=getAllSceneFileNames();
			console.log("add new sceneRanking")
			for(var i=0;i<fileNames.length;i++)
				sceneRanking.push(getSceneRankingItem(fileNames[i],1,1))
		}
		//add new Scene
		if(newFileName)
			sceneRanking.push(getSceneRankingItem(newFileName,10,1))

		writeSceneRanking(sceneRanking);
		
	})
}


function getAllSceneFileNames(){
	var sceneNames = fs.readdirSync('savedAnimations/');
	//remove all filenames begingetSceneRankingItemning with an underscore or a dot
	for(var i=0;i<sceneNames.length;i++){
		if(sceneNames[i].charAt(0)=="_" || sceneNames[i].charAt(0)=="."){
			sceneNames.splice(i,1)
			i--;
		}
	}
	return sceneNames;
}


app.io.route('getSceneRankings', function(req) {
	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
	  if (err) throw err;
	  req.io.emit('sceneRankingsLoaded', data)
	});
})

function gitCommit(commitMessage){
	  	// make a neat commit message to say what happened
		if(!commitMessage) commitMessage= "no details specified";

		// push saved animations
		gitsync.push( { init: true, message: commitMessage }, function( error )
		{
			// log result
			!error && console.log( "Directory \"" + gitsync.directory + "\" has been pushed." );
			error  && console.log( "Error while pushing directory \"" + gitsync.directory + "\":", error );
		});

}


function writeSceneRanking(sceneRanking){
	console.log("try to write scenerankingfile")
	console.log(sceneRanking)

	fs.writeFile('savedAnimations/_sceneRanking', JSON.stringify(sceneRanking), function (err) {
	  if (err){
		console.log("-------------ERROR--------------------");
		console.log(err);
		console.log("-------------ERROREND------------------");
	  }
	  else{
	  app.io.broadcast('sceneRankingsLoaded', JSON.stringify(sceneRanking) )
		console.log('new SceneRanking file was saved');
		gitCommit("sceneRanking file updated")
		console.log('It\'s saved!');
		
	  }	  
	});	
	
}

function writeScheduleFile(schedule){
	if(!schedule)schedule=[];
	console.log("try to write shedule file");
	fs.writeFile('savedAnimations/_schedule', JSON.stringify(schedule), function (err) {
	  if (err){
		console.log("-------------ERROR--------------------");
		console.log(err);
		console.log("-------------ERROREND------------------");
	  }
	  else{
		console.log('new schedule file was saved');
		gitCommit("schedule file updated")
		console.log('It\'s saved!');
	  }	
	  
	});
}

app.io.route('setSceneRanking', function(req) {
	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
		if(data){
			var sceneRanking=[];
			sceneRanking=JSON.parse(data);

			for (var i in sceneRanking) {
				if(req.data[0] == sceneRanking[i]["sceneName"]){
			  		console.log("changing Dynamic setting of " + sceneRanking[i]["sceneName"] + " to " + req.data[1]);
			  		if (req.data[2] == "static")
			  			sceneRanking[i]["staticRating"] = req.data[1]
			  		else if (req.data[2] == "dynamic")
			  			sceneRanking[i]["dynamicRating"] = req.data[1]
			  	}
			}
			writeSceneRanking(sceneRanking)
			req.io.emit('sceneRankingsLoaded', JSON.stringify(sceneRanking))
		}
	})
})

function deleteSceneFromRanking(req) {
	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
		if(data){
			var sceneRanking=[];
			sceneRanking=JSON.parse(data);

			for (var i in sceneRanking) {
				if(req.data[0] == sceneRanking[i]["sceneName"]){
			  		console.log("delete scene from ranting " + sceneRanking[i]["sceneName"] + " to " + req.data[1]);
			  		sceneRanking.splice(i, 1);
			  	}
			}
			writeSceneRanking(sceneRanking)
			req.io.emit('sceneRankingsLoaded', JSON.stringify(sceneRanking))
		}
	})
}

app.io.route('deleteSceneFromRanking', function(req) {
	deleteSceneFromRanking(req)
})

app.io.route('deleteScene', function(req) {

	deleteSceneFromRanking(req)
	deleteSceneFromScheduling(req, true)

	var fs = require('fs');

	fs.unlinkSync('savedAnimations/'+req.data[0], function (err) {
	  if (err) throw err;
	  console.log('successfully deleted /savedAnimations/'+req.data[0]);
	});
	req.io.emit('savedScenesLoaded', getAllSceneFileNames())
})

function readAndEmitSceneRankings(req){
	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
	  if (err) throw err;
	  req.io.emit('sceneRankingsLoaded', data)
	});
}

app.io.route('addToRanking', function(req) {	
	filename=req.data[0]
	addFileToSceneRanking(filename);
})

app.io.route('addToŚcheduling', function(req) {
	console.log("try to add data to schedule")
	filename=req.data[0]
	//change sceneranking file!! 
	fs.readFile('savedAnimations/_schedule', "utf-8", function (err, data) {
	
		if(err)
			console.log("error: "+err)
		
		var schedule=[];
		if(data){
			//add file-data to existing sceneRanking file
			console.log("add file to existing schedule file")
			schedule=JSON.parse(data);
		}
		else{
			//do nothing
			return;
		}
		//add new Scene
		schedule.push(getScheduleItem(filename))

		writeScheduleFile(schedule)

		req.io.emit('scheduledScenesLoaded', JSON.stringify(schedule) )
	})
})

function deleteSceneFromScheduling(req, deleteAllfromName) {
	// req = Filename, index inside array.

	// default parameter
	if(typeof(deleteAllfromName)==='undefined') deleteAllfromName = false;

	fs.readFile('savedAnimations/_schedule', "utf-8", function (err, data) {
		if(data){
			var schedule=[];
			schedule=JSON.parse(data);

			var i = schedule.length
			//reversed for delting. Deleting more than one item breaks the index calculation
			while (i--) {
			  		console.log("delete scene from TEST  "+ i + " - "+ schedule[i]["sceneName"]);

				if((req.data[0] == schedule[i]["sceneName"]) && (req.data[1]==i) || ((deleteAllfromName == true) && (req.data[0] == schedule[i]["sceneName"])) )  {
			  		console.log("delete scene from scheduling " + schedule[i]["sceneName"]);
			  		schedule.splice(i, 1);
			  	}
			}
			writeScheduleFile(schedule)
			req.io.emit('scheduledScenesLoaded', JSON.stringify(schedule))
		}
	})
}

app.io.route('deleteSceneFromScheduling', function(req) {
	deleteSceneFromScheduling(req)
	console.log("deleteSceneFromScheduling")
})

function changeDateForSceneInScheduler(req, useStartDate){
	// scenename, timestamp, index, start/enddate
	var timestamp=req.data[1]
	fs.readFile('savedAnimations/_schedule', "utf-8", function (err, data) {
		if(data){
			var schedule=[];
			schedule=JSON.parse(data);

			if(schedule[req.data[2]]){
				if(schedule[req.data[2]]["sceneName"] == req.data[0]){
					if(useStartDate==true){
						schedule[req.data[2]]["startDate"] = timestamp
						console.log("chagne starttime for scene  "+ req.data[2] + " - "+ schedule[req.data[2]]["sceneName"] +" - "+ timestamp )
					}
					else{
						schedule[req.data[2]]["endDate"] = timestamp
						console.log("chagne endtime for scene  "+ req.data[2] + " - "+ schedule[req.data[2]]["sceneName"] +" - "+ timestamp)
					}
				}
			}
			writeScheduleFile(schedule)
		}
	})
}

app.io.route('changeStartDate', function(req) {
	changeDateForSceneInScheduler(req, true)
	console.log("changeStartDate")
})

app.io.route('changeEndDate', function(req) {
	changeDateForSceneInScheduler(req, false)
	console.log("changeEndDate")
})


function changeRepeatInScheduler(req){
	// scenename, timestamp, index, start/enddate
	var sceneName=req.data[0]
	var repeatValue=req.data[1]
	var index=req.data[2]
	fs.readFile('savedAnimations/_schedule', "utf-8", function (err, data) {
		if(data){
			var schedule=[];
			schedule=JSON.parse(data);

			var i = schedule.length

			if(schedule[index]){
				if(schedule[index]["sceneName"] == sceneName){
					schedule[index]["repeatEach"] = repeatValue
					console.log("chagne repeatEach for scene  "+ index + " - "+ sceneName +" - "+ repeatValue )
				}
			}
			writeScheduleFile(schedule)
		}
	})
}

app.io.route('changeRepeatInScheduler', function(req) {
	changeRepeatInScheduler(req)
	console.log("changeRepeatInScheduler")
})


app.io.route('getSavedScenes', function(req) {
	req.io.emit('savedScenesLoaded', getAllSceneFileNames())
	console.log("getSavedScenes")
})

app.io.route('getSceneData', function(req) {
	fs.readFile('savedAnimations/'+req.data, "utf-8", function (err, data) {
	  if (err) throw err;
	  req.io.emit('sceneDataLoaded', data)
	});
})

//Scheduled Scenes
app.io.route('getScheduledScenes', function(req) {
	fs.readFile('savedAnimations/_schedule', "utf-8", function (err, data) {
	  if (err){ 
		//file does not exist
		console.log(err);
		//write file
		writeScheduleFile();
		
	  }
	  else{
		req.io.emit('scheduledScenesLoaded', data)
	  }
	});
})

var server = app.listen(4887, '127.0.0.1', function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
