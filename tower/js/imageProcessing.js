function imageProcessingObj(){

	var that=this;

	this.processImage = function() {

		var input, file, fr, img;

        if (typeof window.FileReader !== 'function') {
            alert("The file API isn't supported on this browser yet.");
            return;
        }

		input = document.getElementById('imageFile');

        if (!input) {
            alert("Um, couldn't find the imgfile element.");
        }
        else if (!input.files) {
            alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
            alert("Please select a file before clicking 'Load'");
        }
        else {
            file = input.files[0];
            fr = new FileReader();
            fr.onload = createImage;
            fr.readAsDataURL(file);
        }

        function createImage() {
            img = new Image();
            img.onload = imageLoaded;
            img.src = fr.result;
        }

        function imageLoaded() {
        	$("body").append("<canvas id='imageProcessingCanvas'></canvas>");
            var canvas = document.getElementById("imageProcessingCanvas")
            canvas.width = 16;
            canvas.height = img.height/img.width*16;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img,0,0, canvas.width, canvas.height);

            var time = $("#animationTime").val();
            if(!$.isNumeric(time)) {
            	time = 1000;
            }

   			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			var data = imageData.data;

		    var parsedData = "[";

			for (var y = 0; y < canvas.height; y++) {

				parsedData += "{\"duration\":";
			    parsedData += time;
			    parsedData += ",\"type\":1,\"windows\":[";

				for(var x = 0; x < canvas.width; x++) {

					var index = (y * canvas.width + x) * 4;
					var value = x * y & 0xff;

					parsedData+="{\"color\":["+data[index]+","+data[++index]+","+data[++index]+"]";
					parsedData+=",\"active\":1}";
			        
			        if(x < canvas.width-1) {
			            parsedData+=",";
			        }
				}

				parsedData += "]}";

				if(y < canvas.height-1) {
					parsedData += ",";
				}

			}

		    parsedData += "]";

		    framesManager.setData(JSON.parse(parsedData));

		    $("#imageProcessingCanvas").remove();

        }

	}

	
}

var imageProcessing = new imageProcessingObj();