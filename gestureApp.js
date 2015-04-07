var debugMode=true;

var AnimationManagerObj=function(){

	 var animations=[];

	 GESTURETYPES = {
		DOUBLETAP : 0,
		SWIPE_LEFT : 1,
		SWIPE_RIGHT: 2,
		DRAG_UP: 3,
		DRAG_DOWN: 4,
		CHECK: 5,
		PIGTAIL: 6,
		CIRCLE: 7,
		RECTANGLE: 8,
		TRIANGLE: 9,
		BACKGROUND: 9
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
	 * BackgroundAnimationObject
	 * @param {Array.<number>} color
	 * @param {number} windowId
	 * @param {1|-1} direction, 
	 * @param {number} speed 
	 */
	var BackgroundAnimation=function(color,windowId,direction,speed){
		var that=this;
		this.colorArray=color;

		var length=12800;
		var startTime=new Date();
		var currPosition=windowId;

		//get frame for time
		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;

			//always have Progress-value between 0 and 0.99999, so this animation loops
			animationProgressInPercent=animationProgressInPercent%1;
			
			var frame=getBackgroundFrame();	
			currPosition=currPosition+(direction*Math.max(0.2,(speed*2*(1-animationProgressInPercent))));
			frame = setFrameWindowColor(frame,myMod(Math.floor(currPosition)),getPercentualColor(that.colorArray,(1-animationProgressInPercent)));
			return frame;
		}
	} 
	 
	/**
	 * DoubleTapAnimationObject
	 * @param {Array.<number>} color
	 * @param {number} windowId
	 */
	var DoubleTapAnimation=function(color,windowId,range,length){
		if(!range)
			range=5;
		var that=this;
		this.colorArray=color;
		if(!length)
			length=600;
		var startTime=new Date();
		
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
				for(var i=1;i<range;i++){
					frame[myMod(windowId-i)]=getPercentualColor(that.colorArray,(lightness/i));
				}
				frame[windowId]=that.colorArray;
				for(var i=1;i<range;i++){
					frame[myMod(windowId+i)]=getPercentualColor(that.colorArray,(lightness/i));
				}			
				frame[windowId]=that.colorArray
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

		var length=Math.min(16000,5000*speed);
		var startTime=new Date();
		var currPosition=windowId;

		//get frame for time
		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;
			
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				var frame=getBasicFrame();	
				//get current rotating Animation windowId
				currPosition=currPosition+(direction*Math.max(0.2,(speed*2*(1-animationProgressInPercent))));
				//console.log("currPosition "+currPosition)
				frame[myMod(Math.floor(currPosition))]=getPercentualColor(that.colorArray,(1-animationProgressInPercent));
				return frame;
			}
		}
	}



	var CheckAnimation=function(color,windowId){
		return new DoubleTapAnimation(color,windowId,8.1000);
	}
	
	var PigTailAnimation=function(color,windowId){
		return new SwipeAnimation(color,windowId,1,2);
	}	
	
	var RectangleAnimation=function(color,windowId){
		//strobo!!
		var that=this;
		var length=3000;
		var laststrobe=1;
		this.colorArray=color;
		var startTime=new Date();
		var frame=getBasicFrame();
		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				laststrobe*=-1;
				frame[windowId]=laststrobe==-1?[0,0,0]:that.colorArray;
				return frame;
			}
		}
	}
	
	
	
	var TriangleAnimation=function(color,windowId){
		console.log("TRI")
		var that=this;
		var length=2500;
		colorarray=["#002AD1","#082F97","#03484D","#00bfcc","#8f0e97","#630d8d","#330220","#d10052","#8d1800","#97270e","#8d520d","#cca20a","#f0d10c","#579e10","#1a8012","#043300","#008458","#bc5fd1","#759e4c","#404d84","#e5e5e4","#d9625e"]
		this.colorArray=color;
		var startTime=new Date();
		var frame=getBasicFrame();
		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				
				colorId=Math.floor(animationProgressInPercent*(colorarray.length-1));
				frame[windowId]=getRGB(colorarray[colorId]);
				return frame;
			}
		}
	}
	
	
	var CircleAnimation=function(color,windowId){
		//wobble
		var length=2000;
		var range=4;
		var that=this;
		var startTime=new Date();
		this.colorArray=color;

		this.getFrame=function(){
			animationProgressInPercent=(new Date()-startTime)/length;
			if(animationProgressInPercent>1){
				return false; //animation finished
			}
			else{
				var frame=getBasicFrame();
				for(var i=-range;i<range;i++){
					frame[myMod(windowId+i)]=Math.random()<0.7?[0,0,0]:that.colorArray;
				}
				return frame;
			}
		}
	}	
	
	
	this.createAnimation=function(gestureType,client,speed){
		if(speed===null||speed===""||speed===undefined)
			var speed=0.5;
		
		if(GESTURETYPES.PIGTAIL==gestureType){
			return new PigTailAnimation(client.color,client.window);
		}
		if(GESTURETYPES.CHECK==gestureType){
			return new CheckAnimation(client.color,client.window);
		}
		if(GESTURETYPES.TRIANGLE==gestureType){
			return new TriangleAnimation(client.color,client.window);
		}
		if(GESTURETYPES.CIRCLE==gestureType){
			return new CircleAnimation(client.color,client.window);
		}
		if(GESTURETYPES.RECTANGLE==gestureType){
			return new RectangleAnimation(client.color,client.window);
		}		
		if(GESTURETYPES.DOUBLETAP==gestureType){
			return new DoubleTapAnimation(client.color,client.window)
		}
		if(GESTURETYPES.SWIPE_LEFT==gestureType){
			
			return new SwipeAnimation(client.color,client.window,-1,speed)
		}
		if(GESTURETYPES.SWIPE_RIGHT==gestureType){
			return new SwipeAnimation(client.color,client.window,1,speed)
		}
		if(GESTURETYPES.BACKGROUND==gestureType){
			return new BackgroundAnimation(client.color,client.window,1,speed)
		}
		return false;
	}
}

// setup tubemail instance for connections from tower
var Tube = require('tubemail').listen( { port: 4889 } );

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
					resultFrame[j][0]=Math.min(255,window[0]+resultFrame[j][0]); //r
					resultFrame[j][1]=Math.min(255,window[1]+resultFrame[j][1]); //g
					resultFrame[j][2]=Math.min(255,window[2]+resultFrame[j][2]); //b
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
		{
			if(debugMode){
				console.log(frame);
				app.io.broadcast('newFrame', frame);
			}
			else{
				// send frame via tubemail (if ready, i.e. connected and not busy)
				Tube.ready() && Tube.send( frame ) && console.log( "Send: "+JSON.stringify( frame ) );
			}
		}

		that.lastSentFrame=frame;
	}
}

var clientsManagerObj=function(){
	var that=this;
	
	//array to hold all connected clients
	var clients=[];
	
	var emptyClient = {"id":0,"window":0,"color":[150,150,150],"lastActivity":new Date(),"animations":[], "zoom": 0};
	var continousBackgroundAnimation=animationManager.createAnimation(GESTURETYPES.BACKGROUND,emptyClient,1.0);
	
	
	//check for inactive clients and reset Window id to -1
	var checkForInactiveClients=function(){
		var TimeOutInMilliseconds=60000;
		var currentTime=new Date();
		for (var i in clients) {
			if (currentTime-clients[i].lastActivity>TimeOutInMilliseconds&&clients[i].window!=-1){ 
				//free window due to inactivity
				that.setClientAttr(clients[i].id,"window",-1);
				app.io.sockets.socket(clients[i].id).emit("timeout");
				console.log("reset Window for client "+clients[i].id+" due to "+TimeOutInMilliseconds/1000+" seconds inactivity");
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
				if(clients[i].window>-1&&clients[i].window<16) {
				    frame[clients[i].window]=clients[i].color;
				}
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
		// when no one is connected to the tower
		if ( clients.length === 0)
		{		
			//play the BackgroundAnimation Scene	
			var frame=continousBackgroundAnimation.getFrame();
			frames[frames.length]=frame;
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
	//set window to white
	clientsManager.setColor(req.socket.id,[255,255,255]);
	req.io.emit('windowAssigned', freeWindow);
	//console.log(clientsManager.getClients());
})

app.io.route('selectWindowColor', function(req) {
	var color=getRGB(req.data)
	clientsManager.setColor(req.socket.id,color);
	//console.log(clientsManager.getClients());
})

// app.io.route('processHiddenGesture', function(req){
	// console.log("processHiddenGesture: ");
	// console.log(req.data.gesture.Name)
// });

app.io.route('processGesture', function(req) {
	
	//client was active reset death-timeout
	clientsManager.clientAction(req.socket.id);
	
	var gesture=req.data;
	//console.log("gestureType: "+gesture.type+" "+"velocity: "+gesture.velocity)
	console.log(req.data)
	
	
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

// start server, listen only to local requests
var server = app.listen(4898,  function () {

  var host = server.address().address
  var port = server.address().port

  console.log( '\n' + (new Date).toLocaleString()+'\n' + 'gestureApp listening at http://%s:%s/', host, port )

})

// handle tower connection status query
app.get( '/status', function onRequest( request, response )
{
	
	// answer with JSON (active if connected from an IP different from localhost)
	var status = JSON.stringify( { active: Tube.connected && Tube.remote.search(/^127\.0\.0\.1/) === -1 } );
	response.setHeader( 'Content-Type', 'application/json' );
	
	if(debugMode)
		response.end( JSON.stringify( { active:true} ));
	else
		response.end( status );
});



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
 function getBackgroundFrame(){
	return [[68,68,68],[102,102,102],[150,150,150],[102,102,102],[68,68,68],[0,0,0],[0,0,0],[0,0,0],[68,68,68],[102,102,102],[150,150,150],[102,102,102],[68,68,68],[0,0,0],[0,0,0],[0,0,0]];
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
 
function setFrameWindowColor(frame, windowId, color) {
	frame[windowId]=color;
	return frame;
 }
