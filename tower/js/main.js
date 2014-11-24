//socket.io data communication with backend
var io;
var framesManager;
var windowManager;
var myColorPicker;

var currentModalDialogRow = null;
var currentFrameType=null;

$(document).ready(function() { 
	//initialize frameManager
	framesManager= new framesManagerObj($("#storyboard"));
	
	//initialize windowManager 
	windowManager = new windowManagerObj();
	
	//initialize color selection popup
	myColorPicker= new colorPickerObj($("#colorPicker"));
	
	//set color selection in colorpopup
	myColorPicker.addColorSelection();
	
	//initialize 3d Scene
	init3DSceneOnElement($("#3DContainer"));	
	
	
	/**************************
	* Click Events
	**************************/
	
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

	$("#GlowingWindowsCheck").on("change",function(){
		switchGlowingWindows($('#GlowingWindowsCheck').is(':checked'))
		console.log($('#GlowingWindowsCheck').is(':checked'))
		createCookie("withGlowingWindows", $('#GlowingWindowsCheck').is(':checked'), 20 )
	});

   var valueGlowing = readCookie('withGlowingWindows')
    if (valueGlowing) {
    	if(valueGlowing == "true"){
    		$('#GlowingWindowsCheck').prop('checked',  true);
    		switchGlowingWindows( true )
    	}
    	else{
    		$('#GlowingWindowsCheck').prop('checked',  false);
    		switchGlowingWindows( false )
    	}
	}

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
	
	// // Slider - Transition Duration
	// $("#trans_duration").on('slide', function(ev){
		// //$('#trans_duration').data('slider').getValue());
	// });

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
		})
		
		console.log("savedScenesLoaded")
	})
	io.on('sceneDataLoaded', function(data) {
		console.log("sceneDataLoaded")
		framesManager.setData(JSON.parse(data));
	})	

});
	

function showSaveDialog(){
	$('#saveSceneModal').modal('show');
	var date=new Date();
	$('#saveDialog_fileName').val(date.getDate()+"_"+(date.getMonth()+1)+"_"+date.getFullYear()+"_"+date.getHours()+"-"+date.getMinutes()+"-"+date.getSeconds());
}

// Modal Dialog
function modalDialog(inthis){
	if( currentModalDialogRow == null)
	{
		//save current Row for this Transition Dialog
		currentModalDialogRow = parseInt((inthis.id).split("transitionBtn").pop());
		var tmpdata = framesManager.getFrameById(currentModalDialogRow);
		
		//show the Modal Dialog
		$('#myModal').modal('show');
		// set maximum duration to 10seconds
		$("#trans_duration").slider({ max: 10000 }) ;
		/*//set distance-max manually
		$("#trans_duration").data('slider').max = maxSlidervalue;
		$("#trans_duration").data('slider').diff = maxSlidervalue;
		*/

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

var framesManagerObj = function(framesContainer){
	this.framesContainer=framesContainer;
	var data=[];
	var framerate=24;
	this.currentframeId=0;
	this.lastSelectedWindowDiv;
	this.frameAnimationRunning=false;
	var that=this;
	
	this.currentWindowBrushColor="#000000";
	
	var indexBeforeDrag;
	makeFramesContainersortable();
	
	//add drag and drop functions 
	function makeFramesContainersortable(){
		framesContainer.sortable({
			vertical: false,
			  onDragStart: function (item, group, _super) {
				indexBeforeDrag = item.index()
				item.appendTo(item.parent())
				_super(item)
			},
			  onDrop: function  (item, container, _super) {
				var field,
				newIndex = item.index()
				if(newIndex != indexBeforeDrag) {
					framesManager.moveFrame(indexBeforeDrag,newIndex)
				}
				_super(item)
			}
		})
	}

	//go to next Frame if there is one
	function goToNextFrame(){
		if(data.length>1){
			that.currentframeId=(that.currentframeId+1)%data.length;
			setTimeout(function () {goToNextFrame()},data[that.currentframeId].duration)			

		}
		else //animation stoped
			that.frameAnimationRunning=false;
	}
	
	this.getNextFrameId=function(){
		if(data.length>1)
		{
			return ((that.currentframeId+1)%data.length);
		}
		
		return null;
	}

	//start framechange with timer if it isnt already running
	function startAnimation(){
		if(!that.frameAnimationRunning&&data.length>1){
			goToNextFrame()
			that.frameAnimationRunning=true;
		}
	}
	
	this.getData=function(){
		return data;
	}	
	
	this.setData=function(newData){
		data=newData;
		that.currentframeId=0;
		that.renderFrames();
		startAnimation();
	}	

	this.getFramerate=function(){
		return framerate;
	}

	this.setFramerate=function(fps){
		$.each(data,function(i,frame){
			frame.duration=1000/fps;
		})
		framerate = fps;
	}

	this.moveFrame=function(oldIndex, newIndex){
		data.splice(newIndex,0,data.splice(oldIndex,1)[0]);
	}
	
	this.showInModel=function(){
		//parse color to rgb values
		var formatedData=[];
		$.each(data,function(i,frame){
			var newframe={duration:frame.duration,type:frame.type,windows:[]}
			$.each(frame.windows,function(i,window){
				newframe.windows.push(colorGenerator.parseColor(window.color))
			})
			formatedData.push(newframe);
		})
		io.emit("showInModel",formatedData)
	}
	
	this.saveSceneToFile=function(filename){
		io.emit("saveSceneToFile",{"frameData":data,"fileName":filename})
	}
	
	//tell backend to look in saved files folder, load files and submit it to client
	this.getSavedScenes=function(){
		io.emit("getSavedScenes",[])
	}
	
	//tell backend to read content of file and submit it to client
	this.getSavedSceneByName=function(button){
		//tell backend to look in saved files folder, load files and submit it to client
		io.emit("getSceneData",$(button).html())
	}
		
	this.getFrameById=function(inID){
		if(data.length==0)
			return ;
		if( inID > data.length-1)
			return ;
		return data[inID];
	}

	this.colorStrToArray=function(colorStr){
		colorStr = colorStr.slice(colorStr.indexOf('(') + 1, colorStr.indexOf(')')); // "100, 0, 255, 0.5"
		var colorArr = colorStr.split(','),
		    i = colorArr.length;

		while (i--)
		{
		    colorArr[i] = parseInt(colorArr[i], 10);
		}

		var colorObj = {
		    r: colorArr[0],
		    g: colorArr[1],
		    b: colorArr[2],
		    a: colorArr[3]
		}
		return colorObj;
	};

	this.getCurrentFrame=function(startTime,currTime){
		if(data.length==0)
			return ;
		if(data[that.currentframeId].type == 1)
		{
			mixValue = (currTime-startTime)/data[that.currentframeId].duration;
			//var tmp = data.slice(0);
			var tmp = jQuery.extend(true, {}, data[that.currentframeId]);
			var nextFrameId = that.getNextFrameId();
			if( nextFrameId !== null)
			{
				var next = that.getFrame(nextFrameId);
				$.each(tmp.windows,function(i,win){
					//FUCKING COLOR STRING AND OBJECT CONVERSION!
					var c1 = that.colorStrToArray(win.color);
					var c2 = that.colorStrToArray(next.windows[i].color);					
					//FUCKEDUPBULLSHIT
					var newMixedColor = {
					    r: parseInt(c1.r*(1-mixValue)+c2.r*(mixValue)),
					    g:  parseInt(c1.g*(1-mixValue)+c2.g*(mixValue)),
					    b: parseInt( c1.b*(1-mixValue)+c2.b*(mixValue))
					}
					//AND RECONVERT TO FUCKING STRINGS
					win.color = 'rgb('+newMixedColor.r+','+newMixedColor.g+','+newMixedColor.b+')';
				})
			}
			return tmp;
		}
		return data[that.currentframeId];
	}
	

	this.selectFrame=function(evt){
		that.lastSelectedWindowDiv=evt.target;
		framesManager.setSingleWindowColor(that.currentWindowBrushColor);
		myColorPicker.moveToPosition(evt.clientX,evt.clientY);
		myColorPicker.show();
	};

	this.setFrame = function(inFrameID,inType,inDuration,inDelay,inCutoff){
			data[inFrameID].type = inType;
			data[inFrameID].duration = inDuration;
	};

	this.addFrame = function(){
		var newFrame = {duration:1000/24,type:0,windows:[]}; //type 0=still, 1=fade, 2=shift
		for( var i=0;i < 16; i++)
		{
			var window = {color:"rgb(0, 0, 0)", active:1}; 
			newFrame.windows.push(window);
		}
		data.push(newFrame);
		that.renderFrames();
		startAnimation();
	}
	
	this.setSingleWindowColor=function(color,frameId,windowId){
		if(!frameId){
				if(that.lastSelectedWindowDiv)
					frameId=parseInt($(that.lastSelectedWindowDiv).parent().attr("frameid"))
				else 
					frameId=0;
		}
		if(!windowId){
				if(that.lastSelectedWindowDiv)
					windowId=parseInt($(that.lastSelectedWindowDiv).attr("windowid"))
				else 
					windowId=0;
		}
		data[frameId].windows[windowId].color = color;
		
		//change other windows depending on current windowmode
		windowManager.updateData();
		that.renderFrames();
	};
	
	this.deleteFrame=function(id){
		data.splice(id, 1);
		that.renderFrames();
		startAnimation();
	};

	this.getFrame=function(id){
		if(data[id])
			return data[id];
		else
			return null;
	};
	
	//renders Frames after change
	this.renderFrames=function(){		
		windowManager.updateData();
		that.framesContainer.empty();
		var frameDiv = null;
		$.each(data,function(j,frame){
			frameDiv=document.createElement('li')
			$(frameDiv).attr("class","frame")
			$(frameDiv).attr("frameId",j)
			$.each(frame.windows,function(i,frameWindow){
				var windowDiv=document.createElement('div')
				$(windowDiv).attr("windowId",i);
				$(windowDiv).attr("style","background-color:"+frameWindow.color);
			    if(frameWindow.active!=1)
			    	$(windowDiv).css({opacity: 0.2});
		
				$(windowDiv).on("click",that.selectFrame)
				$(frameDiv).append(windowDiv)
			})
			if( j < data.length)
			{
				var transitionA=document.createElement('a')
				//$(transitionA).attr("href","#myModal")
				$(transitionA).attr("href","#")
				$(transitionA).attr("id","transitionBtn"+j)
				$(transitionA).attr("role","button")
				$(transitionA).attr("class","btn btn-xs btn-default transitionBtn")
				$(transitionA).attr("data-toggle","modal")
				$(transitionA).attr("onclick","modalDialog(this);")
				$(transitionA).text("+")
				$(frameDiv).append(transitionA)

				var delFrame=document.createElement('a')
				$(delFrame).attr("href","#")
				$(delFrame).attr("id","deleteFrameBtn"+j)
				$(delFrame).attr("role","button")
				$(delFrame).attr("class","btn btn-xs btn-default deleteFrameBtn")
				$(delFrame).attr("onclick","framesManager.deleteFrame("+j+")")
				$(delFrame).text("-")
				$(frameDiv).append(delFrame)
			}
			that.framesContainer.append(frameDiv)

		})
	}
}

var colorPickerObj=function(colorPickerDiv){
	this.colorPickerDiv=colorPickerDiv;

	var that=this;
	
	this.show=function(){
		that.colorPickerDiv.show();
	}
	this.hide=function(){
		that.colorPickerDiv.hide();
	}
	this.moveToPosition=function(x,y){
		that.colorPickerDiv.css("top",y)
		that.colorPickerDiv.css("left",x)
	}
	
	this.addColorSelection=function(){
		var colorselectionDiv=colorGenerator.getFullColorSelection(10,that.colorPickerDiv.width(),that.colorPickerDiv.height(),3)
		$(colorselectionDiv).find(".singleColor").on("click",function(evt){
			
			var newColor=$(evt.target).css("backgroundColor");
			framesManager.currentWindowBrushColor=newColor;
			$(framesManager.lastSelectedWindowDiv).css("backgroundColor",newColor)
			framesManager.setSingleWindowColor(newColor);
			//myColorPicker.hide();
			that.hide();
		})
		that.colorPickerDiv.append(colorselectionDiv);		
	}
}


var windowManagerObj = function(){
	var windowAmount = 16;
	var windowMode = 2; //0-none 1-one color, 2-repeat, 3-wrap around
	var that = this;
	var c_str_ModeName = ["kein","einfarbig","wiederholen","umlaufend"];

	this.getWindowAmount=function(){
		return parseInt(windowAmount);
	};

	this.getWindowMode=function(){
		return parseInt(windowMode);
	};
	
	this.setWindowAmount=function(newWindowAmount){	
		$("#dd_WindowAmount").text(newWindowAmount+" Fenster");
		if( windowAmount != newWindowAmount)
		{
			/*if( newWindowAmount == 16)
			{
				evt.data.mode = 0;
				that.setWindowMode(evt);
			}		*/	//prevented 16Fenster from working
			windowAmount = newWindowAmount;
			//redraw updates data
			framesManager.renderFrames();
		}
	};
	
	this.setWindowMode=function(newWindowMode){
		if( windowMode != newWindowMode && windowAmount != 16)
		{
			//add function call for frames to handle the new mode
			//something like: frames.setWindowsInactive(windowMode);
			$("#dd_WindowMode").text("Modus: "+c_str_ModeName[newWindowMode]);
			windowMode = newWindowMode;
			framesManager.renderFrames();
		}
	};

	this.updateData=function(){
		var data = framesManager.getData();
	
		//active or non-active divs
		for(var j=0; j < data.length;j++)
		{
			for(var i=0;i < 16;i++)
			{
				if( i < windowAmount)
					data[j].windows[i].active = 1;
				else
					data[j].windows[i].active = 0;
			}
		}
		//colors
		if(windowMode==0) // none
		 return;
		if(windowMode==1) // one color
		{
			for(var j=0; j < data.length;j++)
			{
				for(var i=0;i < 16;i++)
				{
					if(i > windowAmount-1)
						data[j].windows[i].color = "#000000";
				}
			}
		}
		if(windowMode==2) // repeat
		{
			for(var j=0; j < data.length;j++)
			{
				for(var i=0;i < 16;i++)
				{
					data[j].windows[i].color = data[j].windows[i%windowAmount].color;
				}
			}
		}
		if(windowMode==3) // wrap 1234[432112344321] 12[211221122112] 123{3211233211233}
 		{
			for(var j=0; j < data.length;j++)
			{
				for(var i=0;i < 16;i++)
				{
					data[j].windows[i].color = data[j].windows[i%windowAmount].color;					
				}
				if( windowAmount == 2)
				{
					data[j].windows[2].color = data[j].windows[1].color;
					data[j].windows[3].color = data[j].windows[0].color;

					data[j].windows[6].color = data[j].windows[1].color;
					data[j].windows[7].color = data[j].windows[0].color;

					data[j].windows[10].color = data[j].windows[1].color;
					data[j].windows[11].color = data[j].windows[0].color;

					data[j].windows[14].color = data[j].windows[1].color;
					data[j].windows[15].color = data[j].windows[0].color;
				}
				if( windowAmount == 3)
				{
					data[j].windows[3].color = data[j].windows[2].color;
					data[j].windows[4].color = data[j].windows[1].color;
					data[j].windows[5].color = data[j].windows[0].color;

					data[j].windows[6].color = data[j].windows[0].color;
					data[j].windows[7].color = data[j].windows[1].color;
					data[j].windows[8].color = data[j].windows[2].color;

					data[j].windows[9].color = data[j].windows[2].color;
					data[j].windows[10].color = data[j].windows[1].color;
					data[j].windows[11].color = data[j].windows[0].color;

					data[j].windows[12].color = data[j].windows[0].color;
					data[j].windows[13].color = data[j].windows[1].color;
					data[j].windows[14].color = data[j].windows[2].color;
					data[j].windows[15].color = data[j].windows[2].color;

				}
				if( windowAmount == 4)
				{	
					data[j].windows[4].color = data[j].windows[3].color;
					data[j].windows[5].color = data[j].windows[2].color;
					data[j].windows[6].color = data[j].windows[1].color;
					data[j].windows[7].color = data[j].windows[0].color;

					data[j].windows[12].color = data[j].windows[3].color;
					data[j].windows[13].color = data[j].windows[2].color;
					data[j].windows[14].color = data[j].windows[1].color;
					data[j].windows[15].color = data[j].windows[0].color;
				}
				if( windowAmount == 8)
				{	
					data[j].windows[8].color = data[j].windows[7].color;
					data[j].windows[9].color = data[j].windows[6].color;
					data[j].windows[10].color = data[j].windows[5].color;
					data[j].windows[11].color = data[j].windows[4].color;
					data[j].windows[12].color = data[j].windows[3].color;
					data[j].windows[13].color = data[j].windows[2].color;
					data[j].windows[14].color = data[j].windows[1].color;
					data[j].windows[15].color = data[j].windows[0].color;
				}
			}
		}
	}
}
