
$(document).ready(function() { 
	init3DSceneOnElement($("#3DContainer"));
	$("#addFrameBtn").on("click",frames.addFrame)
});

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
	}
	
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

