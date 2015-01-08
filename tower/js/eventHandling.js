/**************************
* Click Events And Interactions
**************************/
function initializeEvents(){

	//disable firefox default dragging shit
	// $(document).on("dragstart", function() {
		 // return false;
	// });
	document.addEventListener('dragstart', function (e) { e.preventDefault(); });


	$("#addFrameBtn").on("click",framesManager.addFrame)
	$("#showInModelBtn").on("click",framesManager.showInModel)
	
	//save dialog
	$("#openSaveDialogBtn").on("click",showSaveDialog)
	
	$("#saveSceneBtn").on("click",function(){
		framesManager.saveSceneToFile($('#saveDialog_fileName').val())
		$('#saveSceneModal').modal('hide');
	})
	
	$("#openColorSelectBtn").on("click",function(event){
		myColorPicker.moveToPosition(event.pageX ,event.pageY );
		myColorPicker.show();
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
	/*
	$(".fps_select").on("click",function(){	
		framesManager.setFramerate(parseInt($(this).attr("fps")))
	});*/

	// Settings dialog
	$("#showSettingBtn").on("click",function(){	
		$('#settings_window').modal('show');
	});

	// Settings dialog
	/*
	$("#switchBtn").on("click",function(){	
		$('#compositor').toggle();

		$('#storyboard').toggle();
		$('#savedScenes').empty();
		framesManager.getSavedScenes();
	});
	*/
	
	$("#GlowingWindowsCheck").on("change",function(){
		tower3D.switchGlowingWindows($('#GlowingWindowsCheck').is(':checked'))
		createCookie("withGlowingWindows", $('#GlowingWindowsCheck').is(':checked'), 20 )
	});

	$("#TopWindowsCheck").on("change",function(){
		tower3D.switchTopWindows($('#TopWindowsCheck').is(':checked'))
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
	        tower3D.changeAmbientLight(newVal)
	        createCookie("luminosity", newVal, 20 )
	    }
	});

	// Modal Dialog
	//save Settings
	$("#resetToWhite").on("click",function(){	
		framesManager.resetFrame(currentModalDialogRow,'white');
		$('#frameShiftingDialog').modal('hide');
	});
	
	$("#resetToBlack").on("click",function(){
		framesManager.resetFrame(currentModalDialogRow,'black');
		$('#frameShiftingDialog').modal('hide');
	});
	
	$("#resetToAbove").on("click",function(){
		framesManager.resetFrame(currentModalDialogRow,'above');
		$('#frameShiftingDialog').modal('hide');
	});

	$("#saveModal").on("click", function() {	
		//currentFrameType 0= static, 1 =fade 
		var currentFrameType = 0;
		if( $('#ft_fade').parent().hasClass('active'))
			currentFrameType = 1;
		framesManager.setFrame(currentModalDialogRow,currentFrameType,parseFloat($('#trans_duration').data('slider').getValue()));
		// hide the modal dialog 
		$('#frameFadingDialog').modal('hide')
	});

	$('#frameFadingDialog').on('hidden.bs.modal', function () {
		//reset the current row when the modal dialog is hidden
		currentModalDialogRow = null;
		currentFrameType = null;
	});

 	$('#create_lines_tf').on('keyup', function(ev){
 		lines = parseInt($('#create_lines_tf').val());
 		$('#create_lines').data('slider').setValue(lines);
 	});

	$('#create_lines').on('slide', function(ev){
	    lines = $('#create_lines').val();
	    $('#create_lines_tf').val(lines);
	});

	$("#saveCreateModal").on("click", function() {
		
		//currentFrameType 0= static, 1 =fade 
		var shifts = 0;
		$( ".cm_shift" ).each(function( index ) {
			if( $( this ).parent().hasClass('active')) 
		  		shifts = parseInt($( this ).attr('name'));//.innerHTML);
		  //
		});
		var lines_slider = 1;
		lines_slider = parseInt($('#create_lines').data('slider').getValue());
		lines_tf = parseInt($('#create_lines_tf').val());
		
		//overwrite slider if lines_tf is larger 
		if(lines_slider < lines_tf)
			lines_slider=lines_tf;
		// hide the modal dialog 
		framesManager.duplicateFrameAndShift(currentModalDialogRow,shifts,lines_slider);
		$('#frameShiftingDialog').modal('hide');
	});

	$('#frameShiftingDialog').on('hidden.bs.modal', function () {
		//reset the current row when the modal dialog is hidden
		currentModalDialogRow = null;
		currentFrameType = null;
	});

	$(document).mouseup(function(event) {
	    switch (event.which) {
	        case 1:
	        	// left mouse
	        	_leftMouseDown = false
				myColorPicker.hide();
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