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
var auth = express.basicAuth('testUser', 'testPass');

//return cut-down version of site
app.use('/', express.static(__dirname + '/tower'));

//return content with full option set
app.use('/protected', auth);
app.use('/protected', express.static(__dirname + '/tower'));


//todo add other apps
function getSceneRankingItem(sceneName,dynamicRating,staticRating){
	var item={};
	item.sceneName=sceneName;
	item.dynamicRating=dynamicRating;
	item.staticRating=staticRating;
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
	
	//change sceneranking file!! 
	fs.readFile('savedAnimations/_sceneRanking', "utf-8", function (err, data) {
		var sceneRanking=[];
		if(data){
			//add file-data to existing sceneRanking file
			console.log("add file to existing sceneRanking file")
			sceneRanking=JSON.parse(data);

			//check if sceneName exists and remove it
			for(var i=0;i<sceneRanking.length;i++){
				if(sceneRanking[i].sceneName==filename){
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
		sceneRanking.push(getSceneRankingItem(filename,10,1))

		fs.writeFile('savedAnimations/_sceneRanking', JSON.stringify(sceneRanking), function (err) {
		  if (err) throw err;
		  console.log('It\'s saved!');
		});
	})
	
	// make a neat commit message to say what happened
	var commitMessage = "app.js: animation '" + filename.trim() + "' saved";
	
	// push saved animations
	gitsync.push( { init: true, message: commitMessage }, function( error )
	{
		// log result
		!error && console.log( "Directory \"" + gitsync.directory + "\" has been pushed." );
		error  && console.log( "Error while pushing directory \"" + gitsync.directory + "\":", error );
	});
})

function getAllSceneFileNames(){
	var sceneNames = fs.readdirSync('savedAnimations/');
	//remove all filenames beginning with an underscore or a dot
	for(var i=0;i<sceneNames.length;i++){
		if(sceneNames[i].charAt(0)=="_" || sceneNames[i].charAt(0)=="."){
			sceneNames.splice(i,1)
			i--;
		}
	}
	return sceneNames;
}

app.io.route('getSavedScenes', function(req) {
	req.io.emit('savedScenesLoaded', getAllSceneFileNames())
})

app.io.route('getSceneData', function(req) {
	fs.readFile('savedAnimations/'+req.data, "utf-8", function (err, data) {
	  if (err) throw err;
	  req.io.emit('sceneDataLoaded', data)
	});
})


var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
