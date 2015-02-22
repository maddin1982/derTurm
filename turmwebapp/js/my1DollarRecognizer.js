
function my1DollarRecognizer() {

	var _points = new Array();
	var _r = new DollarRecognizer();
	var _isDown = false;

	function getScrollY() {
		var scrollY = 0;
		if (typeof(document.body.parentElement) != 'undefined') {
			scrollY = document.body.parentElement.scrollTop; // IE
		} else if (typeof(window.pageYOffset) != 'undefined') {
			scrollY = window.pageYOffset; // FF
		}
		return scrollY;
	}

	this.init = function(element) {

		element.on("touchstart", function (event) {
			if (event.originalEvent.touches.length > 1)
				return;
			// var x=event.clientX;
			// var y=event.clientY;
			event.preventDefault();
			var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
			var elm = $(this).offset();
			var x = touch.pageX - elm.left;
			var y = touch.pageY - elm.top - getScrollY();

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

			evt.preventDefault();


		});

		element.on("touchmove", function (event) {
			if (event.originalEvent.touches.length > 1) {
				_isDown = false;
				_points = new Array();
				return;
			}

			// var x=event.clientX;
			// var y=event.clientY;
			event.preventDefault();
			if (_isDown) {
				var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
				var elm = $(this).offset();
				var x = touch.pageX - elm.left;
				var y = touch.pageY - elm.top - getScrollY();
				_points[_points.length] = new Point(x, y); // append
			}
		});

		element.on("touchend", function (event) {
			document.onselectstart = function () {
				return true;
			} // enable drag-select
			document.onmousedown = function () {
				return true;
			} // enable drag-select
			if (_isDown) {
				_isDown = false;
				if (_points.length >= 10) {
					var result = _r.Recognize(_points, null);
					//console.log("Result: " + result.Name + " (" + Math.round(result.Score,2) + ").");

					hiddenGestures = {
						"pigtail" : {
							"minScore" : 0.88
						},
						"circle" : {
							"minScore" : 0.85
						},
						"zig-zag" : {
							"minScore" : 0.9
						},
						"triangle" : {
							"minScore" : 0.9
						},
						"rectangle" : {
							"minScore" : 0.9
						},
						"x" : {
							"minScore" : 0.9
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
						if (result.Score > hiddenGestures[result.Name].minScore)
							sendHidden1DollarGesture(result);
					}

				} else // fewer than 10 points were inputted
				{
					console.log("Too few points made. Please try again.");
				}
			}
		});
	}
}