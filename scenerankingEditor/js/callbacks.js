/**************************
* Backend Socket Events
**************************/
	
	io= io.connect()

	io.emit("getSceneRankings",[])
	getSavedScened()

	//io Server Responses
	io.on('sceneRankingsLoaded', function(data) {
		console.log("sceneRankingsLoaded")
		data = jQuery.parseJSON(data);

		$("#listOfFiles").empty();
		 $.each(data,function(i,sceneName){	
		   $("#listOfFiles").append("<li class=''><div class='sceneNameSpace f_left'> "+sceneName["sceneName"]+"</div> <div class='sceneNameSpace f_left'> Static Rating: "+sceneName["staticRating"]+" </div>\
		   	<i id='delteBtn' class='ui-icon   ui-icon-minus f_left' onclick='deleteSceneFromRanking(\""+sceneName["sceneName"]+"\")'></i> \
			<i id='incBtn' class='ui-icon ui-icon-circle-arrow-n f_left' onclick='setSceneRanking(\""+sceneName["sceneName"]+"\","+sceneName["staticRating"]+"+1)'></i> \
			<i id='decBtn' class='ui-icon ui-icon-circle-arrow-s f_left' onclick='setSceneRanking(\""+sceneName["sceneName"]+"\","+sceneName["staticRating"]+"-1)'></i> \
			 </li>")
		 })
	})
	
	io.on('savedScenesLoaded', function(data) {
		$("#listOfUnusedFiles").empty();
		 $.each(data,function(i,sceneName){	
		   $("#listOfUnusedFiles").append("<li class=''><div class='sceneNameSpace f_left'> "+sceneName+"</div> \
		   	<i id='addBtn' class='ui-icon ui-icon-plus f_left' onclick='addToRanking(\""+sceneName+"\")'></i> \
			<i id='delteBtn' class='ui-icon  ui-icon-trash f_left' onclick='deleteScene(\""+sceneName+"\")'></i> \
			</li>")
		 })

		console.log("sceneDataLoaded")
	})


function setSceneRanking(scene, rating ){
 console.log("setSceneRanking call")
	io.emit("setSceneRanking",[scene, rating , "static"])
}

function deleteSceneFromRanking(scene){
 console.log("deleteSceneFromRanking call")
	io.emit("deleteSceneFromRanking",[scene])
}

function getSavedScened(){
	io.emit("getSavedScenes",[])
}

function addToRanking(scenename){
	console.log("add to scene" + scenename)
	io.emit("addToRanking",[scenename])
}

function deleteScene(scenename){
	console.log("deleteScene scene" + scenename)
	io.emit("deleteScene",[scenename])
}