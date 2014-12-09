
//file operations
var fs = require('fs');

//serial communication
var SerialPort = require("serialport").SerialPort;


var serialManager =function(){
	var that=this;
	
	this.openSerialport=function(){
		var serialport = new SerialPort("COM6", {
			baudrate: 115200,
			dataBits: 8,
			parity: 'none',
			stopBits: 1,
			flowControl: false 
			},false);
		
		serialport.open(function (error) {
			if ( error ) {
				console.log('failed to open: '+error);
			} else {
				console.log('open');
				serialport.on('data', function(data) {
				  console.log(data)
				});
			}
		})
	}
	
	this.sendFrameToArduino=function(frame){
		var allcolorsSerialized=[];
		for(var i =0; i<frame.windows.length;i++){
			allcolorsSerialized.push(frame.windows[i][0])
			allcolorsSerialized.push(frame.windows[i][1])
			allcolorsSerialized.push(frame.windows[i][2])
		}
		//Serial Messages
		var buffer = new Buffer(allcolorsSerialized);
		serialport.write(buffer, function(err, results) {
			  console.log('err ' + err);
			  console.log('wrote bytes ' + results);
		});
	}
	
	this.showSerialPorts=function(){
		 //SHOW ALL PORTS
		 var SerialPortObj = require("serialport");
		 SerialPortObj.list(function (err, ports) {
			  ports.forEach(function(port) {
				console.log(port.comName);
				console.log(port.pnpId);
				console.log(port.manufacturer);
			  });
		  })
	}
}


var sceneManagerObj = function(){
	var data=[];
	
	
	this.getData=function(){
		return data;
	}
	
	this.getSavedScenes=function(){
		var scenes = fs.readdirSync('savedAnimations/');
	})
	
	this.getSceneData=function(sceneName) {
		fs.readFile('savedAnimations/'+sceneName, "utf-8", function (err, data) {
		  if (err) throw err;
		  //do sth with data
		});
	})

	
}


var PlayerObj = function(DataManager){
	var dataManager=DataManager;
	
	var that=this;
	
	var fps=24;
	
	this.lastFrameId;
	this.currentframeId=0;
	this.frameAnimationRunning=false;
	
	this.currentFrame=[];
	this.lastFrameStartTime=new Date().getTime();
	var data=[];

	//start framechange with timer if it isnt already running
	this.start=function(){
		//update data
		data=dataManager.getData();
		if(!that.frameAnimationRunning&&data.length>1){
			that.goToNextFrame()
			that.frameAnimationRunning=true;
		}
		setInterval(this.playerTick,1000/fps);
	}

	//go to next Frame if there is one
	this.goToNextFrame=function(){
		//update data 
		data=dataManager.getData();
		if(data.length>1){
			that.lastFrameStartTime=new Date().getTime();
			that.currentframeId=that.getNextFrameId();
			setTimeout(function () {that.goToNextFrame()},data[that.currentframeId].duration)			
		}
		else //animation stoped
			that.frameAnimationRunning=false;
	}
	
	this.getNextFrameId=function(){
		if(data.length>1)
			return ((that.currentframeId+1)%data.length);
		return null;
	}

	this.playerTick=function(){
		currTime=new Date().getTime();
		startTime=that.lastFrameStartTime;
		
		if(data.length==0){
			that.currentFrame=[];
			return;
		}
		if(data[that.currentframeId].type == 1)
		{
			mixValue = (currTime-startTime)/data[that.currentframeId].duration;

			var tmp = jQuery.extend(true, {}, data[that.currentframeId]);
			var nextFrameId = that.getNextFrameId();
			if( nextFrameId !== null)
			{
				var next = data[nextFrameId];
				$.each(tmp.windows,function(i,win){
					var c1 = win.color;
					var c2 = next.windows[i].color;					
					win.color = [parseInt(c1[0]*(1-mixValue)+c2[0]*(mixValue)),parseInt(c1[1]*(1-mixValue)+c2[1]*(mixValue)),parseInt( c1[2]*(1-mixValue)+c2[2]*(mixValue))]
				})
			}
			that.currentFrame=tmp;
			return;
		}
		that.currentFrame=data[that.currentframeId];
	}
	
	this.getCurrentFrame=function(){
		return that.currentFrame;
	}	
}
