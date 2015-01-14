var Windows2DObj=function(){

	var that = this;

	var c;
	var ctx;

	var windows_num;
	var center = [];
	var outer_radius = 45;
	var inner_radius = 31;
	var margin = 6;

	this.init2DWindows=function(container, windowAmount) {

		windows_num = windowAmount;

		c = document.getElementById("previewCircleWindow");
		ctx = c.getContext("2d");
		
		center.x = $(c).width()/2.;
		center.y = $(c).height()/2.;
	}

	this.animate=function() {
		var currentFrame=player.getCurrentFrame();
		if(!(currentFrame.windows===undefined)){
			$.each(currentFrame.windows,function(i,window){
				that.setWindowToColor(i,window.color)
			})
		}
	}

	this.setWindowToColor=function(i,newColor){
		
		newColor="rgb("+newColor[0]+","+newColor[1]+","+newColor[2]+")";
		ctx.fillStyle = newColor;
		var a1 = (2.*Math.PI)/windows_num*i-(2.*Math.PI)/windows_num*3;
		var a2 = (2.*Math.PI)/windows_num*(i+1)-(2.*Math.PI)/windows_num*3-margin/outer_radius;
		var x_inner_1 = center.x + inner_radius*Math.cos(a1);
		var x_inner_2 = center.x + inner_radius*Math.cos(a2);
		var x_outer_1 = center.x + outer_radius*Math.cos(a1);
		var x_outer_2 = center.x + outer_radius*Math.cos(a2);
		var y_inner_1 = center.y + inner_radius*Math.sin(a1);
		var y_inner_2 = center.y + inner_radius*Math.sin(a2);
		var y_outer_1 = center.y + outer_radius*Math.sin(a1);
		var y_outer_2 = center.y + outer_radius*Math.sin(a2);
		ctx.beginPath();
		ctx.moveTo(x_inner_1, y_inner_1);
		ctx.lineTo(x_inner_2, y_inner_2);
		ctx.lineTo(x_outer_2, y_outer_2);
		ctx.lineTo(x_outer_1, y_outer_1);
		ctx.closePath();
		ctx.fill();
		
	}

}