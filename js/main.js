
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
	var that=this;
	
	this.addFrame=function(){
		var newFrame=["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
		that.framesArray.push(newFrame)
		that.renderFrames();
	};
	this.setColor=function(frameId,WindowId,color){
		that.framesArray[frameId][WindowId]=color;
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
	this.getNextFrame=function(){
		var nextframe;
		if(that.framesArray.length==0)
			return["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
		if(new Date()-that.lastFrameChange>(1000/that.framerate)){
			that.currentframe=(that.currentframe+1)%that.framesArray.length;	
			that.lastFrameChange=new Date();
		}
		nextframe= that.framesArray[that.currentframe];
		return nextframe
	};
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
				$(windowDiv).colpick({
					submit:0,
					onChange:function(hsb,hex,rgb,el,bySetColor){
						$(el).css('background-color','#'+hex);
						frameId=parseInt($(el).parent().attr("frameId"))
						windowId=parseInt($(el).attr("windowId"))
						frames.setColor(frameId,windowId,'#'+hex)
					}
				});
				$(frameDiv).append(windowDiv)
			})
			that.framesContainer.append(frameDiv)
		})
	}
}
var frames= new framesObj($("#storyboard"));

function renderFrames(){
	$("#storyboard").append("<div>")
}