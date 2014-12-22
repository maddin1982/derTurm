module.exports = function(frameRate) {

	var myFrameRate=frameRate
	
	return {
		parse: function(sceneData) {

			var newdata=[];
			//each frame in scenedata (has duration, type and windowarray)
			for(var i =0;i<sceneData.length;i++){
				var resultingNewFrameCount=myFrameRate*(sceneData[i].duration/1000);
				if(resultingNewFrameCount==0){
					console.log("Something is wrong with the Framerate");
					resultingNewFrameCount=1;
				}
				
				var nextFrameId = i==(sceneData.length-1)?0:i+1;
				var windows=sceneData[i].windows;
				var nextWindows=sceneData[nextFrameId].windows;
				//check data type 1=fading, 0=static
				if(sceneData[i].type==1){
					//for each new added Frame
					for(var j=0; j<resultingNewFrameCount;j++){
						var newWindowArray=[];
						//for each window get interpolated color 
						for(var w=0;w<windows.length;w++){
							var c1 = windows[w].color;
							var c2 = nextWindows[w].color;
							var mixValue=j/resultingNewFrameCount;
							newColor=[parseInt(c1[0]*(1-mixValue)+c2[0]*(mixValue)),parseInt(c1[1]*(1-mixValue)+c2[1]*(mixValue)),parseInt( c1[2]*(1-mixValue)+c2[2]*(mixValue))];
							newWindowArray.push(newColor);
						}
						newdata.push(newWindowArray);
					}
				}
				if(sceneData[i].type==0){
					for(var j=0; j<resultingNewFrameCount;j++){
						var newWindowArray=[];
						for(var w=0;w<windows.length;w++){
							var c = windows[w].color;
							newColor=[c[0],c[1],c[2]];
							newWindowArray.push(newColor);
						}
						newdata.push(newWindowArray);
					}
				}				
			}	
			//parse json and return full json array with Color Array for each Frame
			return newdata;
		 
			//if there was an error return empty array 
			return [];
		}	  
	
	};
  
}