
$(document).ready(function() { 
	init3DSceneOnElement($("#3DContainer"));
	$("#addFrameBtn").on("click",frames.addFrame)
	// fenster anzahl auswählen
	$("#2_fenster").on("click",{count: 2},windowManager.setWindowAmount);
	$("#4_fenster").on("click",{count: 4},windowManager.setWindowAmount);
	$("#8_fenster").on("click",{count: 8},windowManager.setWindowAmount);
	$("#16_fenster").on("click",{count: 16},windowManager.setWindowAmount);
	// Fenster Modus auswählen
	$("#wm_plain").on("click",{mode: 1},windowManager.setWindowMode);
	$("#wm_mirror").on("click",{mode: 2},windowManager.setWindowMode);
	$("#wm_wrap").on("click",{mode: 3},windowManager.setWindowMode);

});

var windowManagerObj = function(){
	var windowCount = 16;
	var windowMode = 0; //0-none 1-one color, 2-mirror, 3-wrap around
	var that = this;
	var c_str_ModeName = ["kein","einfarbig","gespiegelt","umlaufend"];

	this.setWindowAmount=function(evt){
		var newWindowCount = evt.data.count;		
		$("#dd_WindowAmount").text(newWindowCount+" Fenster");
		if( windowCount != newWindowCount)
		{
			if( newWindowCount == 16)
			{
				evt.data.mode = 0;
				that.setWindowMode(evt);
			}
			//add function call for frames to handle the new situation
			//something like: frames.setWindowsInactive(windowMode);	

			windowCount = newWindowCount;
		}
	};
	this.setWindowMode=function(evt){
		var newWindowMode = evt.data.mode;
		$("#dd_WindowMode").text("Modus: "+c_str_ModeName[newWindowMode]);
		if( windowMode != newWindowMode && windowCount != 16)
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
	var that=this;

	this.setColorOnWindow=function(evt){
		console.log(evt);
		popUpMenu.moveToPosition(evt.clientX,evt.clientY);
		popUpMenu.show();
	}
	
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
				$(windowDiv).on("click",that.setColorOnWindow)
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
	
	//public stuff
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
	
	this.colorsGroups=[];
	this.colorsGroups.push({name:"red",position:1,colors:["#330000","#660000","#990000","#CC0000","#FF0000","#FF3333","#FF6666","#FF9999","#FFCCCC"]})
	this.colorsGroups.push({name:"orange",position:2,colors:["#331900","#663300","#994C00","#CC6600","#FF8000","#FF9933","#FFB266","#FFCC99","#FFE5CC"]})
	this.colorsGroups.push({name:"yellow",position:3,colors:["#333300","#666600","#999900","#CCCC00","#FFFF00","#FFFF33","#FFFF66","#FFFF99","#FFFFCC"]})
	this.colorsGroups.push({name:"lightGreen",position:4,colors:["#193300","#336600","#4C9900","#66CC00","#80FF00","#99FF33","#B2FF66","#CCFF99","#E5FFCC"]})
	this.colorsGroups.push({name:"green",position:5,colors:["#003300","#006600","#009900","#00CC00","#00FF00","#33FF33","#66FF66","#99FF99","#CCFFCC"]})
	this.colorsGroups.push({name:"seaGreen",position:6,colors:["#003319","#006633","#00994C","#00CC66","#00FF80","#33FF99","#66FFB2","#99FFCC","#CCFFE5"]})
	this.colorsGroups.push({name:"cyan",position:7,colors:["#003333","#006666","#009999","#00CCCC","#00FFFF","#33FFFF","#66FFFF","#99FFFF","#CCFFFF"]})
	this.colorsGroups.push({name:"blue",position:8,colors:["#001933","#003366","#004C99","#0066CC","#0080FF","#3399FF","#66B2FF","#99CCFF","#CCE5FF"]})
	this.colorsGroups.push({name:"darkBlue",position:9,colors:["#000033","#000066","#000099","#0000CC","#0000FF","#3333FF","#6666FF","#9999FF","#CCCCFF"]})
	this.colorsGroups.push({name:"violet",position:10,colors:["#190033","#330066","#4C0099","#6600CC","#7F00FF","#9933FF","#B266FF","#CC99FF","#E5CCFF"]})
	this.colorsGroups.push({name:"magenta",position:11,colors:["#330033","#660066","#990099","#CC00CC","#FF00FF","#FF33FF","#FF66FF","#FF99FF","#FFCCFF"]})
	this.colorsGroups.push({name:"pink",position:12,colors:["#330019","#660033","#99004C","#CC0066","#FF007F","#100000","#FF3399","#FF99CC","#FFCCE5"]})
	this.colorsGroups.push({name:"grey",position:13,colors:["#000000","#202020","#404040","#606060","#A0A0A0","#C0C0C0","#9E9E9E","#E0E0E0","#FFFFFF"]})


	var height=that.popUpMenuDiv.height()/this.colorsGroups.length;
	var width=that.popUpMenuDiv.width()/this.colorsGroups[0].colors.length;
	$.each(this.colorsGroups,function(i,colorGroup){
		var colorListDiv=document.createElement('div');
		$(colorListDiv).attr("style","clear:both");
		$.each(colorGroup,function(j,color){
			var colorboxDiv=document.createElement('div');
			$(colorboxDiv).attr("style","height:"+height+"px; width:"+width+"px; float:left; background:"+color);
			$(colorListDiv).append(colorboxDiv);
		})
		that.popUpMenuDiv.append(colorListDiv);
	})
	
	
}
var popUpMenu= new popUpMenuObj($("#popUpMenu"));


function renderFrames(){
	$("#storyboard").append("<div>")
}