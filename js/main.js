
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
	$("#wm_repeat").on("click",{mode: 2},windowManager.setWindowMode);
	$("#wm_wrap").on("click",{mode: 3},windowManager.setWindowMode);

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
			frames.renderFrames();
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

			frames.renderFrames();
		}
	};

	this.updateData=function(){
		//active or non-active divs
		for(var j=0; j < data.length;j++)
		{
			for(var i=0;i < 16;i++)
			{
				if( i < windowAmount)
					data[j][i].active = 1;
				else
					data[j][i].active = 0;
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
					if(i > windowAmount)
						data[j][i].color = "#000000";
				}
			}
		}
		if(windowMode==2) // repeat
		{
			for(var j=0; j < data.length;j++)
			{
				for(var i=0;i < 16;i++)
				{
					data[j][i].color = data[j][i%windowAmount].color;
				}
			}
		}
		if(windowMode==3) // wrap 1234[432112344321] 12[211221122112]
 		{
			for(var j=0; j < data.length;j++)
			{
				for(var i=0;i < 16;i++)
				{
					data[j][i].color = data[j][i%windowAmount].color;					
				}
				if( windowAmount == 2)
				{
					data[j][2].color = data[j][1].color;
					data[j][3].color = data[j][0].color;

					data[j][6].color = data[j][1].color;
					data[j][7].color = data[j][0].color;

					data[j][10].color = data[j][1].color;
					data[j][11].color = data[j][0].color;

					data[j][14].color = data[j][1].color;
					data[j][15].color = data[j][0].color;
				}
				if( windowAmount == 4)
				{	
					data[j][4].color = data[j][3].color;
					data[j][5].color = data[j][2].color;
					data[j][6].color = data[j][1].color;
					data[j][7].color = data[j][0].color;

					data[j][12].color = data[j][3].color;
					data[j][13].color = data[j][2].color;
					data[j][14].color = data[j][1].color;
					data[j][15].color = data[j][0].color;
				}
				if( windowAmount == 8)
				{	
					data[j][8].color = data[j][7].color;
					data[j][9].color = data[j][6].color;
					data[j][10].color = data[j][5].color;
					data[j][11].color = data[j][4].color;
					data[j][12].color = data[j][3].color;
					data[j][13].color = data[j][2].color;
					data[j][14].color = data[j][1].color;
					data[j][15].color = data[j][0].color;
				}
			}
		}
	}
}
var data = [];

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

	this.addFrame2 = function(){
		var newFramesArray = [];

		for( var i=0;i < 16; i++)
		{
			var frame = {color:"#000000", active:1}; 
			newFramesArray.push(frame);
		}
		data.push(newFramesArray);
	}

	this.addFrame=function(){
		that.addFrame2();
		var newFrame=["#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000","#000000"]
		that.framesArray.push(newFrame);
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
		data[frameId][windowId].color = color;
		windowManager.updateData();
		that.framesArray[frameId][windowId]=color;
		that.renderFrames();
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
		windowManager.updateData();
		that.framesContainer.empty();
		$.each(that.framesArray,function(j,frame){
			var frameDiv=document.createElement('div')
			$(frameDiv).attr("class","frame")
			$(frameDiv).attr("frameId",j)
			$.each(frame,function(i,frameWindowColor){
				that.framesArray[j][i]=data[j][i].color; // hack to still show the data in the 3D model
				console.log ();
				var windowDiv=document.createElement('div')
				$(windowDiv).attr("windowId",i);
				$(windowDiv).attr("style","background-color:"+data[j][i].color);
			    if(data[j][i].active!=1)
			    	$(windowDiv).css({opacity: 0.2});
		
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
			frames.setSingleWindowColor(newColor);
			popUpMenu.hide();
		})
		that.popUpMenuDiv.append(colorselectionDiv);		
	}
}
var popUpMenu= new popUpMenuObj($("#popUpMenu"));
popUpMenu.addColorSelection();

