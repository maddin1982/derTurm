/**************************
* Backend Socket Events
**************************/
	
	io= io.connect()

	io.emit("getSceneRankings",[])
	getSavedScened()
	getScheduledScenes()

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
		   	<i id='addBtn' class='ui-icon ui-icon-clock f_left' onclick='addToŚcheduling(\""+sceneName+"\")'></i> \
			<i id='delteBtn' class=' ui-icon  ui-icon-trash f_left padLeft' onclick='deleteScene(\""+sceneName+"\")'></i> \
			</li>")
		 })
	})



	io.on('scheduledScenesLoaded', function(data) {
		data = jQuery.parseJSON(data);

		$("#scheduledFiles").empty();
		 $.each(data,function(i,sceneName){	
		   $("#scheduledFiles").append("<li class=''><div class='sceneNameSpace f_left'> "+sceneName["sceneName"]+"</div> \
		   	<i id='delteBtn' class='ui-icon   ui-icon-minus f_left' onclick='deleteSceneFromScheduling(\""+sceneName["sceneName"]+"\","+i+")'></i> \
			  <div id='datetimeStartpicker"+i+"' class='input-append date f_left'> \
			    <input type='text'></input>\
			    <span class='add-on'>\
			      <i data-time-icon='icon-time' data-date-icon='icon-calendar'>\
			      </i>\
			    </span>\
			  </div>\
			  <div id='datetimeEndpicker"+i+"' class='input-append date f_left'> \
			    <input type='text'></input>\
			    <span class='add-on'>\
			      <i data-time-icon='icon-time' data-date-icon='icon-calendar'>\
			      </i>\
			    </span>\
			  </div>\
		    </div> <input class='f_left' id='spinner"+i+"' name='value' value='"+sceneName["repeatEach"]+"'></input> \
			 </li>")

		    $('#datetimeStartpicker'+i).datetimepicker({
		      format: 'dd.MM.yyyy hh:mm:ss',
		      language: 'de'
		    });

			var picker = $('#datetimeStartpicker'+i).data('datetimepicker');
			var date = new Date(sceneName["startDate"]);
			picker.setLocalDate(date);


		    $('#datetimeEndpicker'+i).datetimepicker({
		      format: 'dd.MM.yyyy hh:mm:ss',
		      language: 'de'
		    });

			var picker = $('#datetimeEndpicker'+i).data('datetimepicker');
			var date = new Date(sceneName["endDate"]);
			picker.setLocalDate(date);

		    //$('#datetimeEndpicker'+i).on('changeDate','changeEndDate("'+sceneName["sceneName"]+'","'+sceneName["endDate"]+'","'+i+'")')

		    $('#datetimeEndpicker'+i).on('changeDate', function(e) {
			   timestamp = new Date(e.date).getTime();
			   changeEndDate(sceneName["sceneName"], timestamp, i)
			});

		    $('#datetimeStartpicker'+i).on('changeDate', function(e) {
			  timestamp = new Date(e.date).getTime();
			  changeStartDate(sceneName["sceneName"], timestamp, i)
			});

			var spinner = $( "#spinner"+i ).spinner();
		 })
	})

function addToŚcheduling(scene){
 console.log("addToŚcheduling call")
	io.emit("addToŚcheduling",[scene])
}

function getScheduledScenes(scene, rating ){
 console.log("getScheduledScenes call")
	io.emit("getScheduledScenes",[])
}

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

function deleteSceneFromScheduling(scenename, index)
{
	console.log("delete Scene from scheduler" + scenename)
	io.emit("deleteSceneFromScheduling",[scenename, index])

}

function changeStartDate(scenename, timestamp, index)
{
	console.log("change start date from scheduler" + scenename)
	io.emit("changeStartDate",[scenename, timestamp, index])

}

function changeEndDate(scenename, timestamp, index)
{
	console.log("change end date from scheduler" + scenename)
	io.emit("changeEndDate",[scenename, timestamp, index])

}