var GestureFeedback=function(){
	var that = this;

	var win_num = 16;
	var rotation_t = 2000; //in ms
	var blink_num = 3;
	var blink_state = 0;
	var blink_t = 1000; //in ms
	var zoom = 0;
	// var zoom_f = 0;
	// var zoom_max_t = 3000;
	// var zoom_stepback_t = 200;
	// var zoom_stepback_to;
	var offset = 0;
	var color = "black";
	var color_idle = "#212124";
	var rotate_dir = 1;
	var rotate_state = 0;

	var windows = "#windows div";
	var gesture = "#gestureimg";
	var active_win;

	this.init = function() {
		setActiveWindows(zoom, offset);
	}

	this.idle = function() {
		$(windows).css("background", color_idle);
	}

	this.updatecolor = function(_color) {
		color = _color;
		setcolor(color);
		$(gesture).removeClass();
		$(gesture).addClass("vertical");
		setTimeout(function() {$(gesture).removeClass()}, 300)
	}

	var setcolor = function(_color) {
		active_win.css("background", _color);
	}

	var setActiveWindows = function(_zoom, _offset) {
		var center = (parseInt(win_num/2+_offset+win_num)%win_num)+1;
		active_win = $(windows+":nth-child("+center+")");
		var min_i = center-_zoom-1;
		var max_i = center+_zoom-2;
		if(_zoom > 0) {
			for(var i = min_i; i <= max_i; i++) {
				var _i = ((i+win_num) % win_num) + 1;
				if(_i !== center) {
					active_win = active_win.add($(windows+":nth-child("+_i+")"));
				}
			}
		}
		that.idle();
		setcolor(color);
	}

	this.rotate_left = function(speed) {
		rotate_state = 16;
		rotate_dir = 1;
		rotation_t = 100.0/speed;
		$(gesture).removeClass();
		$(gesture).addClass("left");
		rotate_loop();
	}

	this.rotate_right = function(speed) {
		rotate_state = 16;
		rotate_dir = -1;
		rotation_t = 100.0/speed;
		$(gesture).removeClass();
		$(gesture).addClass("right");
		rotate_loop();
	}

	var rotate_loop = function() {
		that.idle();
		offset = rotate_dir*rotate_state;
		setActiveWindows(zoom, offset);
		if(rotate_state > 0) {			
			setTimeout(function(){rotate_loop()}, rotation_t / win_num);
			rotate_state -= 1;
		}
		else {
			$(gesture).removeClass();
		}
	}

	this.blink = function() {
		blink_state = blink_num*2;
		$(gesture).removeClass();
		$(gesture).addClass("doubletap");
		blink_loop();
	}

	var blink_loop = function() {
		if(blink_state%2 === 0) {
			setcolor(color);
		}
		else {
			setcolor(color_idle);
		}
		if(blink_state > 0) {
			setTimeout(function(){blink_loop()}, blink_t / (blink_num*2));
			blink_state -= 1;
		}
		else {
			$(gesture).removeClass();
		}
	}

	this.setZoom = function(_zoom) {
		zoom = _zoom;
		setActiveWindows(zoom, offset);
	}
}



