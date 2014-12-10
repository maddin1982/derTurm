var PlayerObj = function(DataManager){
	var dataManager=DataManager;
	
	var that=this;
	
	var fps=24;
	
	this.lastFrameId;
	this.currentframeId=0;
	this.frameAnimationRunning=false;
	
	this.currentFrame=[];
	this.lastFrameStartTime=new Date().getTime();
	var data=[];

	//start framechange with timer if it isnt already running
	this.start=function(){
		//update data
		data=dataManager.getData();
		if(!that.frameAnimationRunning&&data.length>1){
			that.goToNextFrame()
			that.frameAnimationRunning=true;
		}
		setInterval(this.playerTick,1000/fps);
	}

	//go to next Frame if there is one
	this.goToNextFrame=function(){
		//update data 
		data=dataManager.getData();
		if(data.length>1){
			that.lastFrameStartTime=new Date().getTime();
			that.currentframeId=that.getNextFrameId();
			setTimeout(function () {that.goToNextFrame()},data[that.currentframeId].duration)			
		}
		else //animation stoped
			that.frameAnimationRunning=false;
	}
	
	this.getNextFrameId=function(){
		if(data.length>1)
			return ((that.currentframeId+1)%data.length);
		return null;
	}

	this.playerTick=function(){
		currTime=new Date().getTime();
		startTime=that.lastFrameStartTime;
		
		if(data.length==0){
			that.currentFrame=[];
			return;
		}
		if(data[that.currentframeId].type == 1)
		{
			mixValue = (currTime-startTime)/data[that.currentframeId].duration;

			var tmp = jQuery.extend(true, {}, data[that.currentframeId]);
			var nextFrameId = that.getNextFrameId();
			if( nextFrameId !== null)
			{
				var next = data[nextFrameId];
				$.each(tmp.windows,function(i,win){
					var c1 = win.color;
					var c2 = next.windows[i].color;					
					win.color = [parseInt(c1[0]*(1-mixValue)+c2[0]*(mixValue)),parseInt(c1[1]*(1-mixValue)+c2[1]*(mixValue)),parseInt( c1[2]*(1-mixValue)+c2[2]*(mixValue))]
				})
			}
			that.currentFrame=tmp;
			return;
		}
		that.currentFrame=data[that.currentframeId];
	}
	
	this.getCurrentFrame=function(){
		return that.currentFrame;
	}	
}