var WindowVector=function(){
	var that=this;
	var lastFrameStartTime=0;

	this.animate=function() {
		requestAnimationFrame(that.animate);

		var currentFrame=player.getCurrentFrame(lastFrameStartTime,new Date().getTime());
		if(!(currentFrame.windows===undefined)){
			$.each(currentFrame.windows,function(i,window){
				that.setWindowToColor(i,window.color)
			})
		}
	}

	this.setWindowToColor=function(i, newColor){
		$( "#window"+i ).css("background-color", newColor);
	}
}