//socket.io data communication with backend
var io;
var framesManager;
var windowManager;
var myColorPicker;
var tower3D;
var player;

var currentModalDialogRow = null;
var currentFrameType=null;
var _shiftPressed;
var _leftMouseDown;

$(document).ready(function() { 
	//initialize frameManager
	framesManager= new framesManagerObj($("#storyboard"));
	framesManager.generateFrameDisplay();
	
	//initialize player
	player= new PlayerObj(framesManager);
	player.start();
	
	//initialize windowManager 
	windowManager = new windowManagerObj();	
	
	//initialize color selection popup
	myColorPicker= new colorPickerObj($("#colorPicker"));
	myColorPicker.addColorSelection();
	
	//initialize 3d Scene
	tower3D=new Tower3DObj();
	tower3D.init3DSceneOnElement($("#3DContainer"));	
	
	//Mouse Events Sliders and so on...
	initializeEvents();
	
	/**************************
	* read Cookies 
	**************************/	
	var valueGlowing = readCookie('withGlowingWindows')
    if (valueGlowing) {
    	if(valueGlowing == "true"){
    		$('#GlowingWindowsCheck').prop('checked',  true);
    		tower3D.switchGlowingWindows( true )
    	}
    	else{
    		$('#GlowingWindowsCheck').prop('checked',  false);
    		tower3D.switchGlowingWindows( false )
    	}
	}

   var valueTopWindows = readCookie('withTopWindows')
    if (valueTopWindows) {
    	if(valueTopWindows == "true"){
    		$('#TopWindowsCheck').prop('checked',  true);
    		tower3D.switchTopWindows( true )
    	}
    	else{
    		$('#TopWindowsCheck').prop('checked',  false);
    		tower3D.switchTopWindows( false )
    	}
	}
	
	/**************************
	* Backend Socket Events
	**************************/
	
	io= io.connect()
	
	//io Server Responses
	io.on('savedScenesLoaded', function(data) {
		//add selectable scenes to dropdown menue
		$("#listOfFiles").empty();
		$.each(data,function(i,sceneName){	
			$("#listOfFiles").append("<li><a onclick='framesManager.getSavedSceneByName(this)'>"+sceneName+"</a></li>")
			$("#savedScenes").append("<li>"+sceneName+"</li>")

		})
		
		console.log("savedScenesLoaded")
	})
	io.on('sceneDataLoaded', function(data) {
		console.log("sceneDataLoaded")
		framesManager.setData(JSON.parse(data));
	})	

});

//SAVE DIALOG	
function showSaveDialog(){
	$('#saveSceneModal').modal('show');
	var date=new Date();
	$('#saveDialog_fileName').val(date.getDate()+"_"+(date.getMonth()+1)+"_"+date.getFullYear()+"_"+date.getHours()+"-"+date.getMinutes()+"-"+date.getSeconds());
}

//ADD NEW LINES WITH FRAME TRANSITION - DIALOG WINDOW
function createFrameShiftingDialog(inthis) {
	if( currentModalDialogRow == null)
	{
		//save current Row for this Transition Dialog
		currentModalDialogRow = parseInt((inthis.id).split("duplicateBtn").pop());
		
		//show the Create Modal Dialog
		$('#frameShiftingDialog').modal('show');
		
		// set maximum duration to 10seconds
		$("#create_lines").slider({min:1, max: 16 }) ;
		$('#create_lines').data('slider').setValue(1);
	}
}

//CREATE FRAME TRANSITION DIALOG
function createFrameFadingDialog(inthis){
	if( currentModalDialogRow == null)
	{
		//save current Row for this Transition Dialog
		currentModalDialogRow = parseInt((inthis.id).split("transitionBtn").pop());
		var tmpdata = framesManager.getFrameById(currentModalDialogRow);
		
		//show the Modal Dialog
		$('#frameFadingDialog').modal('show');
		// set maximum duration to 10seconds
		$("#trans_duration").slider({ max: 10000, step: 100 }) ;

		// set Slider Value correctly
		$('#trans_duration').data('slider').setValue(tmpdata.duration);

		// set Toggle-Buttons for Type correctly
		$("#ft_still").parent().removeClass("active");
		$("#ft_fade").parent().removeClass("active");
		if( tmpdata.type == 0)
			$("#ft_still").parent().addClass("active")
		else if( tmpdata.type == 1)
			$("#ft_fade").parent().addClass("active")
	}
};





