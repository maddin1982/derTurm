var WindowVector=function(){
	var that=this;
	var lastFrameStartTime=0;
	var renderTimeout;
	this.container;
	
	this.create=function(container){
	  that.container=container;
	  for(var i=0;i<16;i++){
		that.container.append("<div id='window"+i+"' class='window'></div>")
	  }
	}
	
	this.hide=function(){
		that.container.hide();
		if(renderTimeout)
			window.clearTimeout(renderTimeout);
	}
	
	this.show=function(){
		that.container.show();
		if(renderTimeout)
			window.clearTimeout(renderTimeout);
		that.play();
	}

	
	this.play=function() {
		renderTimeout=setTimeout( function() {
			that.play();
		}, 1000 / 24 );
	

		var currentFrame=player.getCurrentFrame(lastFrameStartTime,new Date().getTime());
		if(!(currentFrame.windows===undefined)){
			$.each(currentFrame.windows,function(i,window){
				$( "#window"+i ).css("background-color", window.color);
			})
		}
	}

	// this.setWindowToColor=function(i, newColor){
		// $( "#window"+i ).css("background-color", newColor);
	// }
}