var PlayerObj=function(tcpSocketManager,animationManager){
	var that=this;
	//public
	this.curentFrame=0;
	this.fps=24;
	
	//private
	var currentGesture=null;
	var currentAnimationData=null;
	var currentAnimationId=null;
	var intervalId;
	var currentreq=null;

	
	this.playAnimation=function(gesture,req){
	
		var frames=animationManager.getFrames(gesture);

		if (frames instanceof Array&&frames.length>0) {
			if(currentAnimationData===null){
				currentreq=req;
				currentAnimationData=frames;
				currentGesture=gesture;
				intervalId=setInterval(playerTick, 1000 / that.fps);
				currentreq.io.emit('success', "start playing animation for "+gesture.name);
			}
			else{
				console.log("animation already running");
				req.io.emit('error', "animation already running");
			}
		}
		else{
			console.log("cant play because parameter is no array or array is empty");
			console.log("parameter:"+ frames);
			req.io.emit('error', "cannot load animation");
		}
	}
	
	var playerTick=function(){
		if (typeof currentAnimationData[that.curentFrame] !== 'undefined' && currentAnimationData[that.curentFrame] !== null) {
		
			if(that.curentFrame==0){
				currentAnimationId=tcpSocketManager.sendAnimationStart(currentGesture.name);
			}
			if(that.curentFrame==currentAnimationData.length-1){
				//last frame
				currentreq.io.emit('success', "finished playing "+currentGesture.name);
				tcpSocketManager.sendAnimationFinished(currentAnimationId,currentGesture.name);
				resetAnimation();
				return;
			}
			else{
				//hand frame to callback function
				tcpSocketManager.sendFrameToTower(currentAnimationData[that.curentFrame],currentAnimationId);
			}
			
		}
		else{
			console.log("Error in Player, currentFrameId not in frames Array")
		}
		that.curentFrame++;
	}
	
	var resetAnimation=function(){
		clearInterval(intervalId);
		that.curentFrame=0;
		currentAnimationData=null;
	    currentGestureName=null;
		currentAnimationId=null;
		currentreq=null;
		
	}	
}

var AnimationManagerObj=function(){

	var animations=[];
	
	//predefined Gestures
	animations["myGesture"]=[
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],
		[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255]
	]

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
	var that=this;
	
	this.sendAnimationStart=function(animationName){
		var animationId=Math.random().toString(36).substring(7);
		console.log("start id:"+ animationId + " animation: " + animationName);
		return animationId;
	}
	
	this.sendAnimationFinished=function(animationId,animationName){
		console.log("stop id:"+ animationId + " animation:" + animationName);
	}
	
	this.sendFrameToTower=function(frame,animationId){
		console.log(frame);
		
		//
	}
}


var express = require('express.io');
var app = express();
var tcpSocketManager=new TcpSocketManagerObj();
var animationManager=new AnimationManagerObj();
var player=new PlayerObj(tcpSocketManager,animationManager);


//open socket
app.http().io()

//return static folder
app.use('/', express.static(__dirname + '/turmwebapp'));

var clientsManagerObj=function(){
	var clients=[];
	var that=this;
	
	this.getClients=function(){
		return clients;
	}	
	
	this.setWindow=function(id,window){
	     //check if any client already owns this window
		var clientOnWindow=that.getClientBy("window",window);
		
		if(clientOnWindow==false||clientOnWindow["id"]==id)
			return that.setClientAttr(id,"window",window)
		else
			return false;
				
	 }
	
	this.setColor=function(id,color){
		console.log("---------------");
		console.log(color);
		console.log("---------------");
		if(that.getClientBy(id)!==false){
			(that.getClientBy(id))["color"]=color;
			return true;
		}
		return false;
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
	
	this.addClient=function(id){
		clients.push({"id":id,"window":-1,"color":"#000000"});
	}
}

var clientsManager=new clientsManagerObj();


app.io.sockets.on('connection', function(socket) {

  clientsManager.addClient(socket.id);
  console.log(clientsManager.getClients())

  socket.on('disconnect', function() {
	clientsManager.removeClient(socket.id)
	console.log(clientsManager.getClients())
  })
})

app.io.route('selectWindowNumber', function(req) {
	var windowFree=clientsManager.setWindow(req.socket.id,req.data);
	req.io.emit('windowFree', windowFree);
	console.log(clientsManager.getClients());
})

// app.io.route('selectWindowNumberFinal', function(req) {
	// var windowFree=clientsManager.setWindow(req.socket.id,req.data);
	// req.io.emit('windowFree', windowFree);
	// console.log(req.data)
// })

app.io.route('selectWindowColor', function(req) {
	clientsManager.setColor(req.socket.id,req.data);
	console.log(clientsManager.getClients());
})

// app.io.route('selectWindowColorFinal', function(req) {
// console.log(req.data)
// })


app.io.route('processGesture', function(req) {
	var gesture=req.data;
	console.log("window :"+gesture.name)
	player.addAnimation(gesture,req);
})


var server = app.listen(3003, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('tower app listening at http://%s:%s', host, port)

})
