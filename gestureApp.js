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
		//console.log("in")
		//console.log(rgbColorArray)
		var newRgbColorArray=[];
		for(var i=0;i<rgbColorArray.length;i++){
			newRgbColorArray[i]=Math.floor(rgbColorArray[i]*percent);
		}
		//console.log("out")
		//console.log(rgbColorArray)
		return newRgbColorArray;
	 }

	
	GESTURETYPES = {
		DOUBLETAP : 0,
		SWIPE_LEFT : 1,
		SWIPE_RIGHT: 2,
		DRAG_UP: 3,
		DRAG_DOWN: 4
	}
	
	var DoubleTapGesture=function(color,windowId){
		var that=this;
		//short flash
		this.colorArray=getRGB(color);
		var length=1000; //in milliseconds
		var startTime=new Date();
		var range=3;
		
		//get frame for time
		this.getFrame=function(){

			animationProgressInPercent=(new Date()-startTime)/length;
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				var frame=getBasicFrame();	
				//umrechnung der zeit in einen sinus funktionsverlauf
				var lightness=Math.sin(Math.PI*animationProgressInPercent)
				//console.log("lightness "+lightness)
				for(var i=windowId-range;i<windowId+range;i++){
					frame[myMod(i)]=getPercentualColor(that.colorArray,lightness);
				}
				frame[windowId]=that.colorArray;
				return frame;
			}
		}
	}
	
	
	this.createAnimation=function(gestureType,client){
		if(GESTURETYPES.DOUBLETAP==gestureType){
			return new DoubleTapGesture(client.color,client.window)
		}
		return false;
	}
}

//send data to tower over tcp socket
var TcpSocketManagerObj=function(clientsManager){
	
	//add interval to check if clients have animations
	//mix all current clients and windows 
	//send mixed frame to server
	
	var that=this;
	this.fps=20;
	
	//check clients for animations, delete finished animations, mix current animations, hand micex frame to tower
	var watcherTick=function(){
		//clientsManager.deleteFinishedAnimations();
		var frames=clientsManager.getCurrentFrames();
		if(frames.length>0)
			console.log(frames[0])
		
		
		//mix all frames additiv and send to tower
			
	}
	
	this.startWatcher=function(){
		setInterval(watcherTick, 1000 / that.fps);
	}

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
	
	//gets all current frames of all animations in all clients and removes finished animations
	this.getCurrentFrames=function(){
		var frames=[];
		for(var i in clients){
			for(var j in clients[i].animations){
				frame=clients[i].animations[j].getFrame();
				//if getFrame returns false animation is finished, so remove it
				if(!frame){
					clients[i].animations.splice(j, 1);
					j--;
				}
				else{
					frames[frames.length]=frame;
				}
			}
		}
		return frames;
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

var animationManager=new AnimationManagerObj();
//var player=new PlayerObj(tcpSocketManager,animationManager);
var clientsManager=new clientsManagerObj();
var tcpSocketManager=new TcpSocketManagerObj(clientsManager);
tcpSocketManager.startWatcher();
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
	
	//create animation
	animation=animationManager.createAnimation(gesture.type,client);
	//push animation to client
	if(animation){
		client.animations.push(animation);
		//setTimeout(function(){ console.log(animation.getFrame()) }, 200);

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