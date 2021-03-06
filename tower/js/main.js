//socket.io data communication with backend
var io;
var framesManager;
var windowManager;
var myColorPicker;
var tower3D;
var windows2D;
var player;
var windowVector;

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
	myColorPicker= new colorPickerObj($("#colorPicker"), $("#openColorSelectBtn"));
	myColorPicker.addColorSelection(colorGenerator.ColorSets.WARM);

	windowVector = 	new WindowVector();
	windowVector.create($("#windowVector"));
	windowVector.play();

	//initialize 3d Scene
	tower3D=new Tower3DObj();
	tower3D.init3DSceneOnElement($("#scalablePreviewWindow"));

	//initialize 2d Scene
	windows2D=new Windows2DObj();
	windows2D.init2DWindows($("#previewCircleWindow"), 16);
	windows2D.animate();

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
    if (valueTopWindows) 
	{
    	if(valueTopWindows == "true"){
    		$('#TopWindowsCheck').prop('checked',  true);
    		tower3D.switchTopWindows( true )
    	}
    	else{
    		$('#TopWindowsCheck').prop('checked',  false);
    		tower3D.switchTopWindows( false )
    	}
	}


   var valueModelview = readCookie('modelview')
    if (valueModelview){
		if(valueModelview == "fullview"){
			$( "#windowVector" ).hide();
			$( "#luminosityDiv" ).show();
			$( "#GlowingWindowsCheckDiv" ).hide();
			$( "#TopWindowsCheckDiv" ).hide();
		}
		else if (valueModelview == "tower"){
			$( "#windowVector" ).hide();
			$( "#luminosityDiv" ).show();
			$( "#GlowingWindowsCheckDiv" ).show();
			$( "#TopWindowsCheckDiv" ).show();
		}
		else if (valueModelview == "vector"){
			$( "#windowVector" ).show();
			$( "#luminosityDiv" ).hide();
			$( "#GlowingWindowsCheckDiv" ).hide();
			$( "#TopWindowsCheckDiv" ).hide();
		}
	}
	else {
		if(isMobileDevice()){
			// Show Mobile Version
			$( "#windowVector" ).show();
			$( "#luminosityDiv" ).hide();
			$( "#GlowingWindowsCheckDiv" ).hide();
			$( "#TopWindowsCheckDiv" ).hide();
		}
		else{
			$( "#windowVector" ).hide();
			$( "#luminosityDiv" ).show();
			$( "#GlowingWindowsCheckDiv" ).show();
			$( "#TopWindowsCheckDiv" ).show();
		}
	}
	
	/**************************
	* Backend Socket Events
	**************************/
	
	// BEWARE! this call is for the old socket.io API (<1.0)
	io = io.connect( location.origin, { resource: location.pathname.substring(1) + 'socket.io' } );
	
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

function reload3dModel(){
	tower3D.init3DSceneOnElement($("#scalablePreviewWindow"));
}

function stop3dModel() {
	tower3D.stop();
}

// function createVectorDivWindows(){
	// for(var i=0;i<16;i++){
		// $("#windowVector").append("<div id='window"+i+"' class='window'></div>")
	// }

	// windowVector = 	new WindowVector();
	// windowVector.play()

// }


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
		$('#create_lines_tf').val(1);
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





