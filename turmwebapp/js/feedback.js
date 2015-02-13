var GestureFeedback=function(){

	var that = this;

	var win_num = 16;
	var animation_t = 3333; //in ms
	var blink_num = 3;
	var blink_state = 0;
	var zoom = 1;
	var color = "black";
	var color_idle = "#212124";
	var rotate_dir = 1;
	var rotate_state = 0;

	var windows = "#windows div";

	this.idle = function() {
		$(windows).css("background", color_idle);
	}

	this.updatecolor = function(_color) {
		color = _color;
		setcolor(color,0);
	}

	var setcolor = function(_color, offset) {
		var childnum = (parseInt(win_num/2+offset+win_num)%win_num)+1;
		$(windows+":nth-child("+childnum+")").css("background", _color);
	}

	this.rotate_left = function() {
		rotate_state = 16;
		rotate_dir = 1;
		rotate_loop();
	}

	this.rotate_right = function() {
		rotate_state = 16;
		rotate_dir = -1;
		rotate_loop();
	}

	var rotate_loop = function() {
		that.idle();
		setcolor(color, rotate_dir*rotate_state);
		if(rotate_state > 0) {
			setTimeout(function(){rotate_loop()}, animation_t / win_num);
			rotate_state -= 1;
		}
	}

	this.blink = function() {
		blink_state = blink_num*2;
		blink_loop();
	}

	var blink_loop = function() {
		if(blink_state%2 === 0) {
			setcolor(color,0);
		}
		else {
			setcolor(color_idle,0);
		}
		if(blink_state > 0) {
			setTimeout(function(){blink_loop()}, animation_t / (blink_num*2));
			blink_state -= 1;
		}
	}


}