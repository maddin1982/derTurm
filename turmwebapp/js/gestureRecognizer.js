_points = new Array();
_r = new DollarRecognizer();

function startDollarRecognizerOn(element){

	element.on("mouseDown",function(event){
		var x=event.clientX; 
		var y=event.clientY;
		document.onselectstart = function() { return false; } // disable drag-select
		document.onmousedown = function() { return false; } // disable drag-select
		_isDown = true;
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		if (_points.length > 0)
			_g.clearRect(0, 0, _rc.width, _rc.height);
		_points.length = 1; // clear
		_points[0] = new Point(x, y);
		console.log("Recording unistroke...");
	});
	
	element.on("mouseMove",function(event){
		var x=event.clientX; 
		var y=event.clientY;
		if (_isDown)
		{
			x -= _rc.x;
			y -= _rc.y - getScrollY();
			_points[_points.length] = new Point(x, y); // append
		}
	});
	
	element.on("mouseUp",function(event){
		document.onselectstart = function() { return true; } // enable drag-select
		document.onmousedown = function() { return true; } // enable drag-select
		if (_isDown)
		{
			_isDown = false;
			if (_points.length >= 10)
			{
				var result = _r.Recognize(_points, document.getElementById('useProtractor').checked);
				console.log("Result: " + result.Name + " (" + round(result.Score,2) + ").");
			}
			else // fewer than 10 points were inputted
			{
				console.log("Too few points made. Please try again.");
			}
		}
	});
}