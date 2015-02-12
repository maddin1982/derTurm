var AnimationManagerObj=function(){

	 var animations=[];

	 GESTURETYPES = {
		DOUBLETAP : 0,
		SWIPE_LEFT : 1,
		SWIPE_RIGHT: 2,
		DRAG_UP: 3,
		DRAG_DOWN: 4
	}

	 //clone color and multiply by percent value
	 var getPercentualColor=function(rgbColorArray,percent){
		var newRgbColorArray=[];
		for(var i=0;i<rgbColorArray.length;i++){
			newRgbColorArray[i]=Math.floor(rgbColorArray[i]*percent);
		}
		return newRgbColorArray;
	 }
	 
	/**
	 * DoubleTapAnimationObject
	 * @param {Array.<number>} color
	 * @param {number} windowId
	 */
	var DoubleTapAnimation=function(color,windowId){
		var that=this;
		this.colorArray=color;
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
	
	/**
	 * SwipeAnimationObject
	 * @param {Array.<number>} color
	 * @param {number} windowId
	 * @param {1|-1} direction, 
	 * @param {number} speed 
	 */
	var SwipeAnimation=function(color,windowId,direction,speed){
		var that=this;
		this.colorArray=color;

		var length=Math.min(5000,100/speed); 
		var startTime=new Date();

		//get frame for time
		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;
			
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				var frame=getBasicFrame();	
				//get current rotating Animation windowId
				currWindowId=myMod(windowId+(direction*(Math.floor(animationProgressInPercent*16))));
				frame[currWindowId]=that.colorArray;
				return frame;
			}
		}
	}
	
	
	this.createAnimation=function(gestureType,client,speed){
		if(speed===null||speed===""||speed===undefined)
			var speed=0.5;
	
		if(GESTURETYPES.DOUBLETAP==gestureType){
			return new DoubleTapAnimation(client.color,client.window)
		}
		if(GESTURETYPES.SWIPE_LEFT==gestureType){
			
			return new SwipeAnimation(client.color,client.window,-1,speed)
		}
		if(GESTURETYPES.SWIPE_RIGHT==gestureType){
			return new SwipeAnimation(client.color,client.window,1,speed)
		}
		return false;
	}
}

//send data to tower over tcp socket
var TcpSocketManagerObj=function(clientsManager){

	var that=this;
	this.lastSentFrame=[];
	this.fps=20;
	var sendframenomaterwhatinterval=this.fps*10;
	this.frameCounter=0;
	
	//start timer interval to check and mix animations and send to tower
	this.startWatcher=function(){
		setInterval(watcherTick, 1000 / that.fps);
	}
	
	//check clients for animations, delete finished animations, mix current animations, hand micex frame to tower
	var watcherTick=function(){
		that.frameCounter++;
		//get all frames of all clients
		var frames=clientsManager.getCurrentFrames();
		
		//get basic black frame
		var resultFrame=getBasicFrame();
		
		//simply summ all color values of all current frames
		var window;
		for (var i=0;i<frames.length;i++){
			for(var j=0;j<frames[i].length;j++){
				window=frames[i][j];
				if(window.length==3){
					resultFrame[j][0]=Math.min(255,frames[i][j][0]+resultFrame[j][0]); //r
					resultFrame[j][1]=Math.min(255,frames[i][j][1]+resultFrame[j][1]); //g
					resultFrame[j][2]=Math.min(255,frames[i][j][2]+resultFrame[j][2]); //b
				}
			}	
		}
		that.sendFrameToTower(resultFrame)
	}

	this.sendFrameToTower=function(frame){
		if(that.frameCounter>sendframenomaterwhatinterval){
			that.frameCounter=0;
		}
		//only send frame if its not identical with last frame or its a refresh/safety frame 
		if(!colorArraysIdentical(frame,that.lastSentFrame)||that.frameCounter==0)
			console.log(frame);

		that.lastSentFrame=frame;
	}
}

var clientsManagerObj=function(){
	var that=this;
	
	//array to hold all connected clients
	var clients=[];
	
	//check for inactive clients and reset Window id to -1
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
	
	//activate clinetcheckinterval
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
		for(var i=0;i<clients.length;i++){
			if(clients[i].animations.length===0){
				//if there are no animations to play
				frame=getBasicFrame();
				if(clients[i].window>-1&&clients[i].window<16)
					frame[clients[i].window]=clients[i].color;
				frames[frames.length]=frame;
			}
			else{
				for(var j=0; j<clients[i].animations.length;j++){
					frame=clients[i].animations[j].getFrame();
					
					//if getFrame returns false animation is finished, so remove it
					if(!frame){	
						//remove animation
						clients[i].animations.splice(j, 1);
						j--;
					}
					else{
						frames[frames.length]=frame;
					}
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
		clients.push({"id":id,"window":-1,"color":[0,0,0],"lastActivity":new Date(),"animations":[]});
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
  //console.log(clientsManager.getClients())

  socket.on('disconnect', function() {
	clientsManager.removeClient(socket.id)
	//console.log(clientsManager.getClients())
  })
})

app.io.route('selectWindowNumber', function(req) {
	var freeWindow=clientsManager.setWindow(req.socket.id,req.data);
	req.io.emit('windowAssigned', freeWindow);
	//console.log(clientsManager.getClients());
})

app.io.route('selectWindowColor', function(req) {
	var color=getRGB(req.data)
	clientsManager.setColor(req.socket.id,color);
	//console.log(clientsManager.getClients());
})

app.io.route('processGesture', function(req) {
	
	//client was active reset death-timeout
	clientsManager.clientAction(req.socket.id);
	
	var gesture=req.data;
	//console.log("gestureType: "+gesture.type+" "+"velocity: "+gesture.velocity)
	
	var client=clientsManager.getClientBy("id",req.socket.id)
	
	//create animation
	animation=animationManager.createAnimation(gesture.type,client,gesture.velocity);
	
	if(animation){
		//push animation to client
		client.animations.push(animation);
	}
	else{
		console.log("animation could not be created, maybe "+gesture.type+" is not defined yet")
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
	
	//if color is already the right format
	if(Array.isArray(color)){
		if(color.length=3)
			return color;
	}
}
function getBasicFrame(){
	return [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
 }
 
function colorArraysIdentical(a, b) {
    var i = a.length;
    if (i != b.length) return false;
    while (i--) {
        if (a[i][0] !== b[i][0]) return false;
		if (a[i][1] !== b[i][1]) return false;
		if (a[i][2] !== b[i][2]) return false;
    }
    return true;
};
 
 