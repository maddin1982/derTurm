
var SerialPort = require("serialport").SerialPort;

var SerialManagerObj =function(){
	var that=this;
	var serialport;
	var serialPortReady=false;
	
	this.openSerialport=function(){
		serialport = new SerialPort("COM8", {
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
				serialPortReady=true;
				console.log('open');
				serialport.on('data', function(data) {
					console.log(data)
				});
			}
		})
	}
	
	this.sendFrame=function(frame){
		var allcolorsSerialized=[];
		for(var i =0; i<frame.length;i++){
			allcolorsSerialized.push(frame[i][0]);
			allcolorsSerialized.push(frame[i][1]);
			allcolorsSerialized.push(frame[i][2]);					
		}
		
		var allcolorsSerializedRGBW=[];
		for(var i =0; i<frame.length;i++){
			allcolorsSerializedRGBW.push(frame[i][0]);
			allcolorsSerializedRGBW.push(frame[i][1]);
			allcolorsSerializedRGBW.push(frame[i][2]);		
			allcolorsSerializedRGBW.push(0);
		}
		
		if(enableSimulation){
			//broadcast to all connected clients
			app.io.broadcast('newFrame', allcolorsSerialized)
		}

		if(serialPortReady){
			//Serial Messages
			var buffer = new Buffer(allcolorsSerializedRGBW);
			
			if(!serialport)
				throw "serialPort not initialized";
				
			serialport.write(buffer, function(err, results) {
				if(err) throw('err ' + err)
				
			});
		}
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

// var serialManager=new SerialManagerObj();
//serialManager.openSerialport();