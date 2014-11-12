//socket.io data communication with backend
var io;


$(document).ready(function() { 
	init3DSceneOnElement($("#3DContainer"));
	$("#addFrameBtn").on("click",framesManager.addFrame)
	$("#saveSceneBtn").on("click",framesManager.saveDataToBackend)
	$("#saveTransition").on("click",framesManager.setTransition);

	// fenster anzahl auswählen
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
	})
	
	io= io.connect()
});

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
	//var framerate=24;
	this.currentframeId=0;
	this.lastSelectedWindowDiv;
	this.frameAnimationRunning=false;
	var that=this;

	function setTransition(){
		//BUG is not called yet from the modal dialog :(
		//$('#myModal').modal('hide')
	}
	//go to next Frame if there is one
	function goToNextFrame(){
		if(data.length>1){
			setTimeout(function () {goToNextFrame()},data[that.currentframeId].duration)
			that.currentframeId=(that.currentframeId+1)%data.length;
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
	
	this.setFramerate=function(fps){
		$.each(data,function(i,frame){
			frame.duration=1000/fps;
		})
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
	
	this.getCurrentFrame=function(){
		if(data.length==0)
			return ;
		return data[that.currentframeId];
	}
	
	this.selectFrame=function(evt){
		that.lastSelectedWindowDiv=evt.target;
		popUpMenu.moveToPosition(evt.clientX,evt.clientY);
		popUpMenu.show();
	};

	this.addFrame = function(){
		var newFrame = {duration:1000/24,windows:[]};
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
			frameDiv=document.createElement('div')
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
			if( j < data.length-1)
			{
				var transitionA=document.createElement('a')
				$(transitionA).attr("href","#myModal")
				$(transitionA).attr("id","transitionBtn"+j)
				$(transitionA).attr("role","button")
				$(transitionA).attr("class","btn btn-xs btn-default transitionBtn")
				$(transitionA).attr("data-toggle","modal")
				$(transitionA).text("+")
				$(frameDiv).append(transitionA)
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
