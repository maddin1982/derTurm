/**************************
* Click Events And Interactions
**************************/
function initializeEvents(){

	$("#addFrameBtn").on("click",framesManager.addFrame)
	$("#showInModelBtn").on("click",framesManager.showInModel)
	
	//save dialog
	$("#openSaveDialogBtn").on("click",showSaveDialog)
	$("#saveSceneBtn").on("click",function(){
		framesManager.saveSceneToFile($('#saveDialog_fileName').val())
		$('#saveSceneModal').modal('hide');
	})
	
	//load files button
	$("#loadSceneFilesBtn").on("click",framesManager.getSavedScenes)
	
	// Klick auf dropdown für Fensteranzahl
	$(".activeWindowsSelect").on("click",function(){	
		windowManager.setWindowAmount(parseInt($(this).attr("activeWindows")))
	});
	
	// Klick auf dropdown für Fenster Modus
	$(".windowModeSelect").on("click",function(){	
		windowManager.setWindowMode(parseInt($(this).attr("mode")))
	});
	
	// Klick auf dropdown für FPS Select
	$(".fps_select").on("click",function(){	
		framesManager.setFramerate(parseInt($(this).attr("fps")))
	});

	// Settings dialog
	$("#showSettingBtn").on("click",function(){	
		$('#settings_window').modal('show');
	});

	// Settings dialog
	$("#switchBtn").on("click",function(){	
		$('#compositor').toggle();

		$('#storyboard').toggle();
		$('#savedScenes').empty();
		framesManager.getSavedScenes();
	});

	$("#GlowingWindowsCheck").on("change",function(){
		switchGlowingWindows($('#GlowingWindowsCheck').is(':checked'))
		createCookie("withGlowingWindows", $('#GlowingWindowsCheck').is(':checked'), 20 )
	});

	$("#TopWindowsCheck").on("change",function(){
		switchTopWindows($('#TopWindowsCheck').is(':checked'))
		createCookie("withTopWindows", $('#TopWindowsCheck').is(':checked'), 20 )
	});

	// determine if shift is pressed. Used for several copy/move things
	$(document).on('keyup keydown', function(e){_shiftPressed = e.shiftKey} );

	// Slider for the 3D luminosity 
	$("#luminosity").slider({ max: 255 }) ;

    var value = readCookie('luminosity')
    if (value) {
    	$('#luminosity').slider('setValue', value);
	}

	var originalSliderVal;

	$('#luminosity').slider().on('slideStart', function(ev){
	    originalSliderVal = $('#luminosity').data('slider').getValue();
	});

	$('#luminosity').slider().on('slideStop', function(ev){
	    var newVal = $('#luminosity').data('slider').getValue();
	    if(originalSliderVal != newVal) {
	        changeAmbientLight(newVal)
	        createCookie("luminosity", newVal, 20 )
	    }
	});

	// Modal Dialog
	//save Settings
	$("#resetToWhite").on("click",function(){	
		framesManager.resetFrame(currentModalDialogRow,'white');
		$('#myModal').modal('hide');
	});
	
	$("#resetToBlack").on("click",function(){
		framesManager.resetFrame(currentModalDialogRow,'black');
		$('#myModal').modal('hide');
	});
	
	$("#resetToAbove").on("click",function(){
		framesManager.resetFrame(currentModalDialogRow,'above');
		$('#myModal').modal('hide');
	});

	$("#saveModal").on("click", function() {	
		//currentFrameType 0= static, 1 =fade 
		var currentFrameType = 0;
		if( $('#ft_fade').parent().hasClass('active'))
			currentFrameType = 1;
		framesManager.setFrame(currentModalDialogRow,currentFrameType,parseFloat($('#trans_duration').data('slider').getValue()));
		// hide the modal dialog 
		$('#myModal').modal('hide')
	});

	$('#myModal').on('hidden.bs.modal', function () {
		//reset the current row when the modal dialog is hidden
		currentModalDialogRow = null;
		currentFrameType = null;
	});
	
	$("#saveCreateModal").on("click", function() {
		
		//currentFrameType 0= static, 1 =fade 
		var shifts = 0;
		$( ".cm_shift" ).each(function( index ) {
			if( $( this ).parent().hasClass('active')) 
		  		shifts = parseInt($( this ).attr('name'));//.innerHTML);
		  //
		});
		var lines = 1;
		lines = parseInt($('#create_lines').data('slider').getValue());

		// hide the modal dialog 
		framesManager.duplicateFrameAndShift(currentModalDialogRow,shifts,lines);
		$('#createModal').modal('hide')
	});

	$('#createModal').on('hidden.bs.modal', function () {
		//reset the current row when the modal dialog is hidden
		currentModalDialogRow = null;
		currentFrameType = null;
	});

	$('#storyboard').mouseup(function(event) {
	    switch (event.which) {
	        case 1:
	        	// left mouse
	        	_leftMouseDown = false
	            break;
	        case 2:
	        	break;
	        default:
	        	;
	    }
	});
	$('#storyboard').mousedown(function(event) {
	    switch (event.which) {
	        case 1:
	        	// left mouse
	        	_leftMouseDown = true
	            break;
	        case 2:
	        	// middle mouse. 
	        case 3:
	        	// right mouse 
	            myColorPicker.moveToPosition(event.pageX ,event.pageY );
				myColorPicker.show();
	            break;
	        default:
	        	;
	    }
	});
}