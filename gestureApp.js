// var PlayerObj=function(tcpSocketManager,animationManager){
	// var that=this;
	// //public
	// this.curentFrame=0;
	// this.fps=24;
	
	// //private
	// var currentGesture=null;
	// var currentAnimationData=null;
	// var currentAnimationId=null;
	// var intervalId;
	// var currentreq=null;

	
	// this.playAnimation=function(gesture,req){
	
		// var frames=animationManager.getFrames(gesture);

		// if (frames instanceof Array&&frames.length>0) {
			// if(currentAnimationData===null){
				// currentreq=req;
				// currentAnimationData=frames;
				// currentGesture=gesture;
				// intervalId=setInterval(playerTick, 1000 / that.fps);
				// currentreq.io.emit('success', "start playing animation for "+gesture.name);
			// }
			// else{
				// console.log("animation already running");
				// req.io.emit('error', "animation already running");
			// }
		// }
		// else{
			// console.log("cant play because parameter is no array or array is empty");
			// console.log("parameter:"+ frames);
			// req.io.emit('error', "cannot load animation");
		// }
	// }
	
	// var playerTick=function(){
		// if (typeof currentAnimationData[that.curentFrame] !== 'undefined' && currentAnimationData[that.curentFrame] !== null) {
		
			// if(that.curentFrame==currentAnimationData.length-1){
				// //last frame
				// currentreq.io.emit('success', "finished playing "+currentGesture.name);
				// resetAnimation();
				// return;
			// }
			// else{
				// tcpSocketManager.sendFrameToTower(currentAnimationData[that.curentFrame],currentAnimationId);
			// }
			
		// }
		// else{
			// console.log("Error in Player, currentFrameId not in frames Array")
		// }
		// that.curentFrame++;
	// }
	
	// var resetAnimation=function(){
		// clearInterval(intervalId);
		// that.curentFrame=0;
		// currentAnimationData=null;
	    // currentGestureName=null;
		// currentAnimationId=null;
		// currentreq=null;
	// }	
// }

var AnimationManagerObj=function(){

	//erstelle animation für gestennamen
	//animation ist objekt mit startzeit,dauer und einer funktion die den frame für den aktuellen zeitpunkt zurückgibt
	
	//animationen sollen in player eingereiht werden können
	//player mischt animationen die gleichzeitig laufen und sendet pro zeiteinheit ein gemischtes frame an den tcpmanager

	 var animations=[];
	
	 var getBasicFrame=function(){
		return [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
	 }
	 var getPercentualColor=function(rgbColorArray,percent){
		for(var i=0;i<rgbColorArray.length;i++){
			rgbColorArray[i]=Math.floor(rgbColorArray[i]*percent);
		}
		return rgbColorArray;
	 }

	
	GESTURETYPES = {
		DOUBLETAP : 0,
		SWIPE_LEFT : 1,
		SWIPE_RIGHT: 2,
		DRAG_UP: 3,
		DRAG_DOWN: 4
	}
	
	var DoubleTapGesture=function(color,windowId){
		//short flash
		var colorArray=getRGB(color);
		var length=500; //in milliseconds
		var startTime=new Date();
		var range=3;

		
		//get frame for time
		this.getFrame=function(time){
			animationProgressInPercent=(time-startTime)/length;
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				var frame=getBasicFrame();
				var startwindow=windowId-range;
				
				//umrechnung der zeit in einen sinus funktionsverlauf
				var lightness=Math.sin(Math.PI*animationProgressInPercent)
				
				for(var i=startwindow;i<windowId+range;i++){
					frame[myMod(i)]=getPercentualColor(colorArray,lightness);
				}
				return frame;
			}
		}
	}
	
	
	this.createAnimation=function(gestureId,client){
		console.log("GESTURETYPES.DOUBLETAP "+GESTURETYPES.DOUBLETAP)
		console.log("gestureId "+gestureId)
		if(GESTURETYPES.DOUBLETAP==gestureId){
				console.log("DOUBLETAP")
			return new DoubleTapGesture(client.color,client.window)
		}
		return false;
	}
	
	

	this.getFrames=function(gesture){
	
		//TODO : Process Gesture 
	
		if (typeof animations[gesture.name] !== 'undefined' && animations[gesture.name] !== null) {
			return animations[gesture.name];
		}
		else{
			console.log("Animation not found")
			return [];
		}		
	}
}

//send data to tower over tcp socket
var TcpSocketManagerObj=function(){
	
	//add interval to check if clients have animations
	//mix all current clients and windows 
	//send mixed frame to server
	
	var that=this;
	
	
	this.sendFrameToTower=function(frame,animationId){
		console.log(frame);
		
		//
	}
}

var clientsManagerObj=function(){
	var clients=[];
	var that=this;

	var checkForInactiveClients=function(){
		var TimeOutInMilliseconds=60000;
		var currentTime=new Date();
		for (var i in clients) {
			if (currentTime-clients[i].lastActivity>TimeOutInMilliseconds&&clients[i].window!=-1){ 
				//free window due to inactivity
				that.setClientAttr(clients[i].id,"window",-1);
				app.io.sockets.socket(clients[i].id).emit("timeout");
				console.log("reset Window for client "+clients[i].id+" due to "+TimeOutInMilliseconds/1000+" seconds inactivity")
				console.log(that.getClients())
			}
		}
	}
	//check for inactive clients and remove from list
	var clientInactivityCheck=setInterval(checkForInactiveClients, 2000);
	
	this.getClients=function(){
		return clients;
	}	
	
	this.setWindow=function(id,window){
	    //update timeout for client inactivity
		that.clientAction(id);
		
		var preferedWindows=[window,myMod(window-1),myMod(window+1),myMod(window-2),myMod(window+2)]

		//check if any client already owns this window
		for(var i=0;i<preferedWindows.length;i++){
			var clientOnWindow=that.getClientBy("window",preferedWindows[i]);
			if(clientOnWindow==false||clientOnWindow["id"]==id){
				if(that.setClientAttr(id,"window",preferedWindows[i]))
					return preferedWindows[i];
			}
		}
		return -1;
	 }
	
	this.setColor=function(id,color){
		//update timeout for client inactivity
		that.clientAction(id);
		return that.setClientAttr(id,"color",color)
	}
	
	this.setClientAttr=function(id,attr,value){
		for (var i in clients) {
			if (clients[i].id == id){ 
				clients[i][attr]=value;
				return true;
			}
		}
		return false;
	}	
	
	this.getClientBy=function(attr,value){
		for (var i in clients) {
			if (clients[i][attr] == value) 
				return clients[i];
		}
		return false;
	}
	
	this.removeClient=function(id){
		for (var i in clients) {
			if (clients[i].id == id) {
				clients.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	
	//update last active to prevent client timeout
	this.clientAction=function(id){
		that.setClientAttr(id,"lastActivity",new Date());
	}
	
	this.addClient=function(id){
		clients.push({"id":id,"window":-1,"color":"#000000","lastActivity":new Date(),"animations":[]});
	}
}


var express = require('express.io');
var app = express();
var tcpSocketManager=new TcpSocketManagerObj();
var animationManager=new AnimationManagerObj();
//var player=new PlayerObj(tcpSocketManager,animationManager);
var clientsManager=new clientsManagerObj();

//open socket
app.http().io()

//return static folder
app.use('/', express.static(__dirname + '/turmwebapp'));



app.io.sockets.on('connection', function(socket) {

  clientsManager.addClient(socket.id);
  console.log(clientsManager.getClients())

  socket.on('disconnect', function() {
	clientsManager.removeClient(socket.id)
	console.log(clientsManager.getClients())
  })
})


app.io.route('selectWindowNumber', function(req) {
	var freeWindow=clientsManager.setWindow(req.socket.id,req.data);
	req.io.emit('windowAssigned', freeWindow);
	console.log(clientsManager.getClients());
})

app.io.route('selectWindowColor', function(req) {
	clientsManager.setColor(req.socket.id,req.data);
	console.log(clientsManager.getClients());
})

app.io.route('processGesture', function(req) {
	clientsManager.clientAction(req.socket.id);
	var gesture=req.data;
	console.log("gestureType: "+gesture.type+" "+"velocity: "+gesture.velocity)
	var client=clientsManager.getClientBy("id",req.socket.id)
	
	animation=animationManager.createAnimation(client,gesture.type);
	if(animation){
		client.animations.push(animation);
		console.log(client);
	}
})


var server = app.listen(3003, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})



/**************************************************************
* HELPERS
**************************************************************/
function myMod(x) {
	//modulo fix for 16 windows
        return ((x % 16) + 16) % 16;
}
function getRGB(color) {

	// Function used to determine the RGB colour value that was passed as HEX
    var result;
	
    // Look for rgb(num,num,num)
    if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

    // Look for rgb(num%,num%,num%)
    if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color)) return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55];

    // Look for #a0b1c2
    if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color)) return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];

    // Look for #fff
    if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)) return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16)];
}