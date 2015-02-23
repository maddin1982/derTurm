
function my1DollarRecognizer() {

	var _points = new Array();
	var _r = new DollarRecognizer();
	var _isDown = false;

	var lastTap=new Date();
	
	var gestureBegin,gestureEnd; //time to calculate velocity
	
	
	this.maxDoubleTapTime=400; //ms
	this.maxTapDownTime=250; //ms
	this.maxDoubleTapDistance=20; //px
	
	
	this.minSwipeDistance=60; //px
	//horizontal swipe
	this.maxVerticalDistance=60; //px
	//vertical swipe
	this.maxHorizontalDistance=60; //px
	
	function getScrollY() {
		var scrollY = 0;
		if (typeof(document.body.parentElement) != 'undefined') {
			scrollY = document.body.parentElement.scrollTop; // IE
		} else if (typeof(window.pageYOffset) != 'undefined') {
			scrollY = window.pageYOffset; // FF
		}
		return scrollY;
	}
	
	this.gestureToEventMap={};
	
	this.on=function(gesturetype,callbackfunction){
		this.gestureToEventMap[gesturetype]=callbackfunction;
	}
	this.off=function(gesturetype){
		delete this.gestureToEventMap[gesturetype];
	}	

	this.callListeners=function(gesturetype,data){
		if(this.gestureToEventMap[gesturetype])
			this.gestureToEventMap[gesturetype](data);
	}

	var that=this;
	
	this.init = function(element) {

		element.on("touchstart mousedown", function (event) {
			gestureBegin=new Date();
			
			//is mousedown event
			var x,y;
			if(event.type=="mousedown"){
				x=event.clientX;
				y=event.clientY;
			
			}
			else{
				//two fingers, used for brighness gesture, return
				if (event.originalEvent.touches.length > 1)
					return;
				var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
				x = touch.pageX;
				y = touch.pageY;
			}
			
		    var elm = $(this).offset();
			x = x - elm.left;
			y = y - elm.top - getScrollY();


			document.onselectstart = function () {
				return false;
			} // disable drag-select
			document.onmousedown = function () {
				return false;
			} // disable drag-select
			
			_isDown = true;

			// if (_points.length > 0)
			// _g.clearRect(0, 0, _rc.width, _rc.height);
			_points.length = 1; // clear
			_points[0] = new Point(x, y);
			console.log("Recording unistroke...");

			event.preventDefault();
		});

		element.on("touchmove mousemove", function (event) {
			var x,y;
			
			if (_isDown) {
				if(event.type=="mousemove"){
					x=event.clientX;
					y=event.clientY;
				}
				else{
					if (event.originalEvent.touches.length > 1) {
						_isDown = false;
						_points = new Array();
						return;
					}
					var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
					x = touch.pageX;
					y = touch.pageY;
				}
				var elm = $(this).offset();
				x = x - elm.left;
				y = y - elm.top - getScrollY();
				_points[_points.length] = new Point(x, y);
			}
			event.preventDefault();
		});

		$(document).on("touchend mouseup", function (event) {
			// document.onselectstart = function () {
				// return true;
			// } // enable drag-select
			// document.onmousedown = function () {
				// return true;
			// } // enable drag-select
			
			gestureEnd=new Date();
			
			if (_isDown) {
				_isDown = false;
				if (_points.length >= 10) {
					var result = _r.Recognize(_points, null);
					//console.log("Result: " + result.Name + " (" + Math.round(result.Score,2) + ").");

					hiddenGestures = {
						"pigtail" : {
							"minScore" : 0.8
						},
						"circle" : {
							"minScore" : 0.85
						},
						"zig-zag" : {
							"minScore" : 0.8
						},
						"triangle" : {
							"minScore" : 0.8
						},
						"rectangle" : {
							"minScore" : 0.8
						},
						"x" : {
							"minScore" : 0.8
						},
						"caret" : {
							"minScore" : 0.85
						},
						"check" : {
							"minScore" : 0.8
						},
						"v" : {
							"minScore" : 0.9
						},
						"delete" : {
							"minScore" : 0.9
						},
						"star" : {
							"minScore" : 0.9
						}
					}
					if (hiddenGestures[result.Name]) {
						if (result.Score > hiddenGestures[result.Name].minScore){
							//sendHidden1DollarGesture(result);
							
							if(result.Name=="pigtail")
							   that.callListeners("pigtail");
							if(result.Name=="check")
							   that.callListeners("check");
							return;
						}
					}
					//console.log("Too few points made. Please try again.");
				} 
					//test for doubletap or swipe
					
					var distance=lineDistance(_points[0],_points[_points.length-1]);
					var time =gestureEnd-gestureBegin;
					
					var verticalDistance=Math.abs(_points[0].Y-_points[_points.length-1].Y);
					var horizontalDistance=Math.abs(_points[0].X-_points[_points.length-1].X);
					
					if(distance<that.maxDoubleTapDistance&& time<that.maxTapDownTime){
						//check for double tap
						if(new Date()-lastTap<that.maxDoubleTapTime)
						that.callListeners("doubleTap");
						lastTap=new Date();
					}
					else{
						if(distance>that.minSwipeDistance&&verticalDistance<that.maxVerticalDistance){
							//its probably a Swipe
							velocity=distance/time;
							direction=(_points[0].X-_points[_points.length-1].X)<0?1:-1;
							//normalize velocity
							console.log( " velocity " +velocity + "  direction "+direction );
							that.callListeners("horizontalSwipe",{"velocity":velocity,"direction":direction});
							return;
						}
						if(distance>that.minSwipeDistance&&horizontalDistance<that.maxHorizontalDistance){
							//its probably a Swipe
							velocity=distance/time;
							direction=(_points[0].Y-_points[_points.length-1].Y)<0?1:-1;
							//normalize velocity
							console.log( " velocity " +velocity + "  direction "+direction );
							that.callListeners("verticalSwipe",{"velocity":velocity,"direction":direction});
						}
					}	
				
			}
		});
	}
}

function lineDistance( point1, point2 )
    {
    var xs = 0;
    var ys = 0;
     
    xs = point2.X - point1.X;
    xs = xs * xs;
     
    ys = point2.Y - point1.Y;
    ys = ys * ys;
     
    return Math.sqrt( xs + ys );
}
