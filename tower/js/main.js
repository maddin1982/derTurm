//socket.io data communication with backend
var io;


$(document).ready(function() { 
	init3DSceneOnElement($("#3DContainer"));
	$("#addFrameBtn").on("click",framesManager.addFrame)
	$("#saveSceneBtn").on("click",framesManager.saveDataToBackend)

	// fenster anzahl auswählen
	$("#1_fenster").on("click",{amount: 1},windowManager.setWindowAmount);
	$("#2_fenster").on("click",{amount: 2},windowManager.setWindowAmount);
	$("#4_fenster").on("click",{amount: 4},windowManager.setWindowAmount);
	$("#8_fenster").on("click",{amount: 8},windowManager.setWindowAmount);
	$("#16_fenster").on("click",{amount: 16},windowManager.setWindowAmount);
	// Fenster Modus auswählen
	$("#wm_plain").on("click",{mode: 1},windowManager.setWindowMode);
	$("#wm_repeat").on("click",{mode: 2},windowManager.setWindowMode);
	$("#wm_wrap").on("click",{mode: 3},windowManager.setWindowMode);

	$(".fps_select").on("click",function(){	
		framesManager.setFramerate(parseInt($(this).attr("fps")))
	});
	// Modal Dialog
	//save Settings
	$("#saveModal").on("click", function() {
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
	
	// Slider - Transition Duration
	$("#trans_duration").on('slide', function(ev){
		//$('#trans_duration').data('slider').getValue());
	});

	io= io.connect()
});
	

var currentModalDialogRow = null;
var currentFrameType=null;
// Modal Dialog
function modalDialog(inthis){
	if( currentModalDialogRow == null)
	{
		//save current Row for this Transition Dialog
		currentModalDialogRow = (inthis.id).split("transitionBtn").pop();
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
	
	this.setWindowAmount=function(evt){
		var newWindowAmount = evt.data.amount;		
		$("#dd_WindowAmount").text(newWindowAmount+" Fenster");
		if( windowAmount != newWindowAmount)
		{
			if( newWindowAmount == 16)
			{
				evt.data.mode = 0;
				that.setWindowMode(evt);
			}			
			windowAmount = newWindowAmount;
			//redraw updates data
			framesManager.renderFrames();
		}
	};
	
	this.setWindowMode=function(evt){
		var newWindowMode = evt.data.mode;
		
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
		if(windowMode==3) // wrap 1234[432112344321] 12[211221122112]
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



var framesManagerObj = function(framesContainer){
	this.framesContainer=framesContainer;
	var data=[];
	var framerate=24;
	this.currentframeId=0;
	this.lastSelectedWindowDiv;
	this.frameAnimationRunning=false;
	var that=this;

	//go to next Frame if there is one
	function goToNextFrame(){
		if(data.length>1){
			that.currentframeId=(that.currentframeId+1)%data.length;
			setTimeout(function () {goToNextFrame()},data[that.currentframeId].duration)			

		}
		else //animation stoped
			that.frameAnimationRunning=false;
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
	
	this.saveDataToBackend=function(){
		//parse color to rgb values
		var formatedData=[];
		$.each(data,function(i,frame){
			var newframe={duration:frame.duration,windows:[]}
			$.each(frame.windows,function(i,window){
				newframe.windows.push(colorGenerator.parseColor(window.color))
			})
			formatedData.push(newframe);
		})
		io.emit("data",formatedData)
	}
	this.getFrameById=function(inID){
		if(data.length==0)
			return ;
		if( inID >= data.length-1)
			return ;
		return data[inID];
	}
	this.getCurrentFrame=function(){
		if(data.length==0)
			return ;
		if(data[that.currentframeId].type == 1)
			console.log("animated Frame :)");
		return data[that.currentframeId];
	}
	
	this.selectFrame=function(evt){
		that.lastSelectedWindowDiv=evt.target;
		popUpMenu.moveToPosition(evt.clientX,evt.clientY);
		popUpMenu.show();
	};

	this.setFrame = function(inFrameID,inType,inDuration,inDelay,inCutoff){
			data[inFrameID].type = inType;
			data[inFrameID].duration = inDuration;
	};

	this.addFrame = function(){
		var newFrame = {duration:1000/24,type:0,windows:[]}; //type 0=still, 1=fade, 2=shift
		for( var i=0;i < 16; i++)
		{
			var window = {color:"#000000", active:1}; 
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
var framesManager= new framesManagerObj($("#storyboard"));
var windowManager = new windowManagerObj();

var popUpMenuObj=function(popUpMenuDiv){
	this.popUpMenuDiv=popUpMenuDiv;

	var that=this;
	
	this.show=function(){
		that.popUpMenuDiv.show();
	}
	this.hide=function(){
		that.popUpMenuDiv.hide();
	}
	this.moveToPosition=function(x,y){
		that.popUpMenuDiv.css("top",y)
		that.popUpMenuDiv.css("left",x)
	}
	
	this.addColorSelection=function(){
		var colorselectionDiv=colorGenerator.getFullColorSelection(10,that.popUpMenuDiv.width(),that.popUpMenuDiv.height(),3)
		$(colorselectionDiv).find(".singleColor").on("click",function(evt){

			var newColor=$(evt.target).css("backgroundColor");
			$(framesManager.lastSelectedWindowDiv).css("backgroundColor",newColor)
			framesManager.setSingleWindowColor(newColor);
			popUpMenu.hide();
		})
		that.popUpMenuDiv.append(colorselectionDiv);		
	}
}
var popUpMenu= new popUpMenuObj($("#popUpMenu"));
popUpMenu.addColorSelection();

