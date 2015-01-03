
var framesManagerObj = function(framesContainer){
	var that=this;

	this.framesContainer=framesContainer;
	var data=[];
	this.lastSelectedWindowDiv;
	this.currentWindowBrushColor=[0,0,0];
	
	var indexBeforeDrag;
	makeFramesContainersortable();
	
	//add drag and drop functions 
	function makeFramesContainersortable(){
		framesContainer.sortable({
			handle: 'i.icon-move',
			vertical: false,
			  onDragStart: function (item, group, _super) {

				indexBeforeDrag = item.index()
				item.appendTo(item.parent())
				_super(item)
			},
			  onDrop: function  (item, container, _super) {
				var field,
				newIndex = item.index()
				//Copy frame instead of moving when shift is pressed.
				if(_shiftPressed==true){
					framesManager.copyFrame(indexBeforeDrag,newIndex)
				}
				else{
					if(newIndex != indexBeforeDrag) {
						framesManager.moveFrame(indexBeforeDrag,newIndex)
					}
				}
				_super(item)
			}
		})
	}
	
	this.duplicateFrameAndShift=function(inID, inSteps, inCount){
		if(data.length==0)
			return ;
		if( inID > data.length-1)
			return ;		
		//prepare Variable for wraparound steps
		var k=0;
		while( k < inSteps)
			k+=16;
		while( inCount > 0)
		{
			that.addFrame(inID);
			var nextFrameID = inID+1;
			$.each(data[nextFrameID].windows,function(i,win){				
				win.color = data[inID].windows[(i+k-inSteps)%16].color;				
			})
			//set the new Frame to the attributes (duration, animation-type) of the old one
			that.copyFrameAttributes(inID,nextFrameID);
			inCount--;
			inID++;
		}
		that.renderFrames();
	}

	this.resetFrame=function(inID, inMode){
		if(data.length==0)
			return ;
		if( inID > data.length-1)
			return ;
		if( inMode === 'white')
		{
			$.each(data[inID].windows,function(i,win){
				win.color = [255,255,255];
			})
		}
		else if( inMode === 'black')
		{
			$.each(data[inID].windows,function(i,win){
				win.color = [0,0,0];
			})
		}
		else if( inMode === 'above' && inID > 0)
		{
			$.each(data[inID].windows,function(i,win){
				win.color = data[inID-1].windows[i].color;
			})
		}
		that.renderFrames();
	}

	this.copyFrameAttributes=function(inSrcID,inTargetID)
	{
		//TODO: do this automatically if there will be more attributes 
		data[inTargetID].duration = data[inSrcID].duration;
		data[inTargetID].type = data[inSrcID].type;
	}

	
	this.getData=function(){
		return data;
	}	
	
	this.setData=function(newData){
		data=newData;
		that.currentframeId=0;
		that.renderFrames();
		player.start();
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

	this.copyFrame=function(origin, destination){
		data.splice(destination, 0, data[origin]);
		that.renderFrames();
	}

	this.showInModel=function(){
		//parse color to rgb values
		var formatedData=[];
		$.each(data,function(i,frame){
			var newframe={duration:frame.duration,type:frame.type,windows:[]}
			$.each(frame.windows,function(i,window){
				newframe.windows.push(window.color)
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

	this.selectFrame=function(evt){
		that.lastSelectedWindowDiv=evt.target;
		framesManager.setSingleWindowColor(that.currentWindowBrushColor);	
	};

	this.setFrame = function(inFrameID,inType,inDuration,inDelay,inCutoff){
			data[inFrameID].type = inType;
			data[inFrameID].duration = inDuration;
	};

	this.addFrame = function(inFrameID){
		var newFrame = {duration:1000/24,type:0,windows:[]}; //type 0=still, 1=fade, 2=shift
		for( var i=0;i < 16; i++)
		{
			var window = {color:[0,0,0], active:1}; 
			newFrame.windows.push(window);
		}
		if(inFrameID == null)
			data.push(newFrame);
		else
			data.splice(inFrameID+1, 0,newFrame);
		that.renderFrames();
		player.start();
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

	this.mouseMovedOverFrame=function(event){
 		var current = $(this);
 		if(_leftMouseDown == true) {
			that.lastSelectedWindowDiv=event.target;
			framesManager.setSingleWindowColor(that.currentWindowBrushColor);
		}
	}

	//renders Frames after change
	this.renderFrames=function(){		
		windowManager.updateData();
		that.framesContainer.empty();
		var frameDiv = null;
		$.each(data,function(j,frame){
			frameDiv=document.createElement('li')
			$(frameDiv).attr("class","frame")
			$(frameDiv).attr("frameId",j)
			iIcon=document.createElement('i')
			$(iIcon).attr("class","icon-move ui-icon ui-icon-carat-2-n-s")
			$(frameDiv).append(iIcon)
			$.each(frame.windows,function(i,frameWindow){
				var windowDiv=document.createElement('div')
			$(windowDiv).mousemove(function( event ) {
				that.mouseMovedOverFrame(event)
				});
				$(windowDiv).attr("windowId",i);
				$(windowDiv).attr("style","background-color: rgb("+frameWindow.color[0]+","+frameWindow.color[1]+","+frameWindow.color[2]+")");
			    if(frameWindow.active!=1)
			    	$(windowDiv).css({opacity: 0.2});
		
				$(windowDiv).on("click",that.selectFrame)
				$(frameDiv).append(windowDiv)
			})
			if( j < data.length)
			{
				var addFrame=document.createElement('i')
				$(addFrame).attr("id","deleteFrameBtn"+j)
				$(addFrame).attr("class","ui-icon ui-icon-plus f_left")
				$(addFrame).attr("onclick","framesManager.addFrame("+j+")")
				$(frameDiv).append(addFrame)

				var frameFadingDialogBtn=document.createElement('i')
				$(frameFadingDialogBtn).attr("id","transitionBtn"+j)
				$(frameFadingDialogBtn).attr("class","ui-icon ui-icon-shuffle f_left")
				$(frameFadingDialogBtn).attr("data-toggle","modal")
				$(frameFadingDialogBtn).attr("onclick","createFrameFadingDialog(this);")
				$(frameDiv).append(frameFadingDialogBtn)

				var frameShiftingDialogBtn=document.createElement('i')
				$(frameShiftingDialogBtn).attr("id","transitionBtn"+j)
				$(frameShiftingDialogBtn).attr("class","ui-icon ui-icon-signal f_left")
				$(frameShiftingDialogBtn).attr("data-toggle","modal")
				$(frameShiftingDialogBtn).attr("onclick","createFrameShiftingDialog(this);")
				$(frameDiv).append(frameShiftingDialogBtn)

				var delFrame=document.createElement('i')
				$(delFrame).attr("id","deleteFrameBtn"+j)
				$(delFrame).attr("class","ui-icon  ui-icon-trash f_left")
				$(delFrame).attr("onclick","framesManager.deleteFrame("+j+")")
				$(delFrame).text("-")
				$(frameDiv).append(delFrame)
			}
			that.framesContainer.append(frameDiv)

		})
	}
}