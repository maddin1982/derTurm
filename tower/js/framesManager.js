
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
		that.generateFrameDisplay();
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
		that.generateFrameDisplay();
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
		that.generateFrameDisplay();
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
		that.generateFrameDisplay();
	}

	this.copyFrame=function(origin, destination){
		data.splice(destination, 0, data[origin]);
		that.generateFrameDisplay();
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

	// this.selectFrame=function(evt){
		// that.lastSelectedWindowDiv=evt.target;
		// framesManager.setSingleWindowColor(that.currentWindowBrushColor);	
	// };
	// this.=function(event){
 		// if(_leftMouseDown == true) {
			
			// framesManager.setSingleWindowColor(that.currentWindowBrushColor);
		// }
	// }

	
	

	this.setFrame = function(inFrameID,inType,inDuration,inDelay,inCutoff){
			data[inFrameID].type = inType;
			data[inFrameID].duration = inDuration;
			if( inType==1)
				$( "#transitionBtn"+inFrameID).text("["+(inDuration/1000)+"]");
			else if( inType==0)
				$( "#transitionBtn"+inFrameID).text("("+(inDuration/1000)+")");
	};

	this.addFrame = function(inFrameID){
		var newFrame = {duration:100,type:1,windows:[]}; //type 0=still, 1=fade, 2=shift
		for( var i=0;i < 16; i++)
		{
			var window = {color:[0,0,0], active:1}; 
			newFrame.windows.push(window);
		}
		if(inFrameID == null)
			data.push(newFrame);
		else
			data.splice(inFrameID+1, 0,newFrame);
		that.generateFrameDisplay();
		player.start();
	}
	
	this.setSingleWindowColor=function(event){
		if(_leftMouseDown == true||event.type=="click") {
			that.lastSelectedWindowDiv=event.target;
			color=that.currentWindowBrushColor;
			frameId=parseInt($(event.target).parents('.frame').attr("frameid"))

			windowId=parseInt($(event.target).attr("windowid"))

			data[frameId].windows[windowId].color = color;
			
			//change other windows depending on current windowmode
			windowManager.updateData();
			
			that.redrawSingleFrame(frameId)
			//that.generateFrameDisplay();
		}
		event.preventDefault();
		event.stopPropagation();
	};
	
	//redraw a single frame if color was changed instead of redraw all frames
	this.redrawSingleFrame=function(frameId){
		var frame=$("#storyboard").find("[frameid='" + frameId + "']");
		var windowDivs=$(frame).find(".windowContainer").children();
		var windowData=data[frameId].windows;
		for(var i=0;i<windowData.length;i++){
			$(windowDivs[i]).attr("style","background-color: rgb("+windowData[i].color[0]+","+windowData[i].color[1]+","+windowData[i].color[2]+")");
		}
	}

	this.deleteFrame=function(id){
		data.splice(id, 1);
		that.generateFrameDisplay();
		player.restart();
	};

	this.getFrame=function(id){
		if(data[id])
			return data[id];
		else
			return null;
	};


	//generates Frames after change
	this.generateFrameDisplay=function(){	

		if(data.length==0){
			that.framesContainer.empty();
			var frameContainer = null;
			var addFrameIcon=document.createElement('i')
			//$(addFrame).attr("id","addFrameBtn"+j)
			$(addFrameIcon).attr("class","ui-icon ui-icon-plus f_left")
			$(addFrameIcon).attr("onclick","framesManager.addFrame()")
			console.log("aff icon")
			that.framesContainer.append(addFrameIcon);
		}
		else{
			windowManager.updateData();	
			that.framesContainer.empty();
			var frameContainer = null;
			$.each(data,function(j,frame){
			
				//create frame li element
				frameContainer=document.createElement('li')
				$(frameContainer).attr({class:"frame",frameId:j})
		
				var rowDiv=document.createElement('div');
				$(rowDiv).attr("class","row");
		
				//create move icon
				var moveFrameIcon=document.createElement('i')
				$(moveFrameIcon).attr("class","icon-move ui-icon ui-icon-carat-2-n-s f_left")
				
				var addFrameIcon=document.createElement('i')
				//$(addFrame).attr("id","addFrameBtn"+j)
				$(addFrameIcon).attr("class","ui-icon ui-icon-plus f_left")
				$(addFrameIcon).attr("onclick","framesManager.addFrame("+j+")")

				//create container for move and add icon icon
				var leftFrameOptionsDiv=document.createElement('div')
				$(leftFrameOptionsDiv).attr("class","col-xs-1")
				
				$(leftFrameOptionsDiv).append(addFrameIcon)
				$(leftFrameOptionsDiv).append(moveFrameIcon)
				
				$(rowDiv).append(leftFrameOptionsDiv)
				
				//create container windows
				var windowsContainerDiv=document.createElement('div')
				$(windowsContainerDiv).attr("class","col-xs-9 col-lg-10 windowContainer")

				$.each(frame.windows,function(i,frameWindow){

					var windowDiv=document.createElement('div')
					// $(windowDiv).mousemove(function( event ) {
						// that.mouseMovedOverFrame(event)
					// });
					$(windowDiv).attr("windowId",i);
					$(windowDiv).attr("style","background-color: rgb("+frameWindow.color[0]+","+frameWindow.color[1]+","+frameWindow.color[2]+")");
					if(frameWindow.active!=1)
						$(windowDiv).css({opacity: 0.2});
			
					$(windowDiv).on("click mousemove",that.setSingleWindowColor)
					$(windowsContainerDiv).append(windowDiv)
				})
				$(rowDiv).append(windowsContainerDiv)
				
				//create container for delete shifting and animation ptions
				var rightFrameOptionsDiv=document.createElement('div')
				$(rightFrameOptionsDiv).attr("class","col-xs-2 col-md-2 col-lg-1")
				
				if( j < data.length)
				{
					var frameFadingDialogBtn=document.createElement('i')
					$(frameFadingDialogBtn).attr("id","transitionBtn"+j)
					$(frameFadingDialogBtn).attr("class","small_time")
					$(frameFadingDialogBtn).attr("data-toggle","modal")
					$(frameFadingDialogBtn).attr("onclick","createFrameFadingDialog(this);")
					
					if(frame.type == 1)
						$(frameFadingDialogBtn).text("["+(frame.duration/1000).toFixed(1) +"]");	
					else
						$(frameFadingDialogBtn).text("("+(frame.duration/1000).toFixed(1) +")");
					$(rightFrameOptionsDiv).append(frameFadingDialogBtn)

					var frameShiftingDialogBtn=document.createElement('i')
					$(frameShiftingDialogBtn).attr("id","duplicateBtn"+j)
					$(frameShiftingDialogBtn).attr("class","ui-icon ui-icon-signal f_left")
					$(frameShiftingDialogBtn).attr("data-toggle","modal")
					$(frameShiftingDialogBtn).attr("onclick","createFrameShiftingDialog(this);")
					$(rightFrameOptionsDiv).append(frameShiftingDialogBtn)

					var delFrame=document.createElement('i')
					$(delFrame).attr("id","deleteFrameBtn"+j)
					$(delFrame).attr("class","ui-icon  ui-icon-trash f_left")
					$(delFrame).attr("onclick","framesManager.deleteFrame("+j+")")
					$(delFrame).text("-")
					$(rightFrameOptionsDiv).append(delFrame)
					
					$(rowDiv).append(rightFrameOptionsDiv)
				}
				$(frameContainer).append(rowDiv);
				that.framesContainer.append(frameContainer);

			})
		}
	}
}