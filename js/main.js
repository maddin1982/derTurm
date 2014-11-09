
$(document).ready(function() { 
	init3DSceneOnElement($("#3DContainer"));
	$("#addFrameBtn").on("click",frames.addFrame)
	// fenster anzahl auswählen
	$("#2_fenster").on("click",{amount: 2},windowManager.setWindowAmount);
	$("#4_fenster").on("click",{amount: 4},windowManager.setWindowAmount);
	$("#8_fenster").on("click",{amount: 8},windowManager.setWindowAmount);
	$("#16_fenster").on("click",{amount: 16},windowManager.setWindowAmount);
	// Fenster Modus auswählen
	$("#wm_plain").on("click",{mode: 1},windowManager.setWindowMode);
	$("#wm_mirror").on("click",{mode: 2},windowManager.setWindowMode);
	$("#wm_wrap").on("click",{mode: 3},windowManager.setWindowMode);

});

var windowManagerObj = function(){
	var windowAmount = 16;
	var windowMode = 0; //0-none 1-one color, 2-mirror, 3-wrap around
	var that = this;
	var c_str_ModeName = ["kein","einfarbig","gespiegelt","umlaufend"];

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
			//add function call for frames to handle the new situation
			//something like: frames.setWindowsInactive(windowMode);	

			windowAmount = newWindowAmount;
		}
	};
	this.setWindowMode=function(evt){
		var newWindowMode = evt.data.mode;
		$("#dd_WindowMode").text("Modus: "+c_str_ModeName[newWindowMode]);
		if( windowMode != newWindowMode && windowAmount != 16)
		{
			//add function call for frames to handle the new mode
			//something like: frames.setWindowsInactive(windowMode);
			windowMode = newWindowMode;
		}
	};
}

var framesObj = function(framesContainer){
	this.framesContainer=framesContainer;
	this.framesArray=[];
	this.framerate=10;
	this.currentframe=0;
	this.lastFrameChange=new Date();
	//last klicked frame
	this.lastSelectedWindowDiv;
	var that=this;

	this.selectFrame=function(evt){
		that.lastSelectedWindowDiv=evt.target;
		popUpMenu.moveToPosition(evt.clientX,evt.clientY);
		popUpMenu.show();
	};
	
	this.addFrame=function(){
		var newFrame=["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
		that.framesArray.push(newFrame)
		that.renderFrames();
	};
	
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
		that.framesArray[frameId][windowId]=color;
	};
	
	this.deleteFrame=function(id){
		that.framesArray.splice(id, 1);
	};

	this.getFrame=function(id){
		if(that.framesArray[id])
			return that.framesArray[id];
		else
			return null;
	};
	
	//returns next frame depending on framerate
	this.getNextFrame=function(){
		var nextframe;
		//return black windows if no frame exists
		if(that.framesArray.length==0)
			return["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
		
		if(new Date()-that.lastFrameChange>(1000/that.framerate)){
			that.currentframe=(that.currentframe+1)%that.framesArray.length;	
			that.lastFrameChange=new Date();
		}
		nextframe= that.framesArray[that.currentframe];
		return nextframe
	};
	
	//renders Frames after change
	this.renderFrames=function(){
		that.framesContainer.empty();
		$.each(that.framesArray,function(i,frame){
			var frameDiv=document.createElement('div')
			$(frameDiv).attr("class","frame")
			$(frameDiv).attr("frameId",i)
			$.each(frame,function(i,frameWindowColor){
				var windowDiv=document.createElement('div')
				$(windowDiv).attr("windowId",i);
				$(windowDiv).attr("style","background-color:"+frameWindowColor);
				$(windowDiv).on("click",that.selectFrame)
				$(frameDiv).append(windowDiv)
			})
			that.framesContainer.append(frameDiv)
		})
	}
}
var frames= new framesObj($("#storyboard"));
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
			$(frames.lastSelectedWindowDiv).css("backgroundColor",newColor)
			frames.setSingleWindowColor(newColor)
			popUpMenu.hide();
		})
		that.popUpMenuDiv.append(colorselectionDiv);		
	}
}
var popUpMenu= new popUpMenuObj($("#popUpMenu"));
popUpMenu.addColorSelection();

