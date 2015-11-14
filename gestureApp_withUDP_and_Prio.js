
/* debug mode for console output, ignoring tubemail*/
var DEBUGMODE=false;

/* timeout to kill inactive client*/
var CLIENTTIMEOUT=60000;

/*
**************************************************************************************
*	ANIMATIONS
**************************************************************************************
*/
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
	 * PlasmaAnimationObject
	 * @param {Array.<number>} color
	 * @param {number} windowId
	 * @param {1|-1} direction, 
	 * @param {number} speed 
	 */
	var PlasmaAnimation=function(){
		var that=this;
		var time=0;
		var fadein=0;
		
		this.restart=function(){
			fadein=0;
			time=0;
		}

		this.getCollorArray=function(x,time,fadein){
			var brightnessRegulator=0.2;
		
			var v1 = Math.sin((x+time));
			var v2= Math.sin(x*Math.sin((x+time/2))+Math.cos((x+time/3))+time);
			var v3= x+ 0.5*Math.sin(time/5);
			var v4=  0.5*Math.cos(time/3);
			var v5= Math.sin(Math.sqrt(100*(Math.pow(v3,2)+Math.pow(v4,2)))+time);
			var v=v1+v2+v5;
			var brightness=Math.abs((Math.sin(v*Math.PI+6*Math.PI/5)+0.5)*brightnessRegulator);
			
			var r=Math.floor((Math.sin(v*Math.PI)*122+122 )*fadein*brightness);
			var g=Math.floor((Math.sin(v*Math.PI+2*Math.PI/3)*122+122) *fadein*brightness);
			var b=Math.floor((Math.sin(v*Math.PI+4*Math.PI/3)*122+122) *fadein*brightness);
			return [r,g,b];
		}

		//get frame for time
		this.getFrame=function(){
			time+=0.005;
			if(fadein<1)
				fadein+=0.01;
			var frame=[];
			for(var i=0;i<16;i++){
				frame[i]=this.getCollorArray((i/15-0.5),time,fadein);
			}
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

	this.getPlasmaAnimation=function(){
		return new PlasmaAnimation();
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


/*
**************************************************************************************
*	TUBEMAIL
**************************************************************************************
*/

/* setup tubemail instance for connections from tower */
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
		
		//get basic black frame
		var resultFrame=getBasicFrame();	
		var frames=[];
		//check if there was a recent udp message
		if(udpMessageManager.active()){
			//get recent udp frame
			frames=[udpMessageManager.getLastValidFrameArray()];
		}
		else{
			//get all frames of all clients
			frames=clientsManager.getCurrentFrames();
		}

		
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
			if(DEBUGMODE){
				console.log(JSON.stringify( frame ));
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


/*
**************************************************************************************
*	CLIENTSMANAGER
**************************************************************************************
*/

var clientsManagerObj=function(){
	var that=this;

	//array to hold all connected clients
	var clients=[];
	
	//var emptyClient = {"id":0,"window":0,"color":[150,150,150],"lastActivity":new Date(),"animations":[], "zoom": 0};
	//var continousBackgroundAnimation=animationManager.createAnimation(GESTURETYPES.BACKGROUND,emptyClient,1.0);
	var continuousAnimation=animationManager.getPlasmaAnimation();
	
	//check for inactive clients and reset Window id to -1
	var checkForInactiveClients=function(){
		var TimeOutInMilliseconds=CLIENTTIMEOUT;
		var currentTime=new Date();
		for (var i in clients) {
			if (currentTime-clients[i].lastActivity>TimeOutInMilliseconds&&clients[i].window!=-1){ 
				//free window due to inactivity
				that.setClientAttr(clients[i].id,"window",-1);
				app.io.sockets.socket(clients[i].id).emit("timeout");
				console.log("reset Window for client "+clients[i].id+" due to "+TimeOutInMilliseconds/1000+" seconds inactivity");
				
				if(that.getActiveClientCount()==0)
					continuousAnimation.restart();
			}
		}
	}
	
	//activate clinetcheckinterval
	var clientInactivityCheck=setInterval(checkForInactiveClients, 2000);
	
	this.getClients=function(){
		return clients;
	}	
	
	this.getActiveClientCount=function(){
		var count=0;
		for (var i in clients) {
			if(clients[i].window>-1){
				count++;
			}
		}
		return count;
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
		if ( this.getActiveClientCount() == 0)
		{	
			//play the BackgroundAnimation Scene	
			//var frame=continousBackgroundAnimation.getFrame();
			var frame=continuousAnimation.getFrame();
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

/*
**************************************************************************************
*	INCOMMING UDP CONNECTIONS (PHONE)
**************************************************************************************
*/
var dgram = require('dgram');

var udpMessageManager=function(){
	var that=this;
	var PORT = 33333;
	var HOST = '0.0.0.0';
	var server;
	var lastValidMessageTime=0;
	var lastValidHighPrioMessageTime=0;
	var colorValues,colorValue;
	var udpActiveTimeInSeconds=10;
	var lastValidFrameArray=[];
	var lastValidHighPrioFrameArray=[];
	
	this.init=function(){
		server = dgram.createSocket('udp4');
		
		server.on('message', function (message, remote) {
			that.processMessage(''+message);
		});
		server.bind(PORT, HOST);
	}
	/* message format: [kazoosh]||100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255 */
	this.processMessage=function(message){
		var colorArrayResult=getBasicFrame();
		if(message.indexOf('[kazoosh]')!==-1||message.indexOf('[kazoosh!]')!==-1){
			var messageValid=true;
			var splitted=message.split('||');
			if(splitted.length===2){
				splitted=splitted[1].split('|')
				if(splitted.length===16){
					for(var i=0;i<16;i++){
						
						colorValues=splitted[i].split(',');
						if(colorValues.length===3){
							for(var j=0;j<3;j++){
								colorValue=parseInt(colorValues[j]);
								if(colorValue>=0&&colorValue<=255){
									colorArrayResult[i][j]=colorValue;
								}
								else{
									messageValid=false;
								}
							}
						}
						else{
							messageValid=false;
						}
					}
					if(messageValid){
						if(message.indexOf('[kazoosh!]')!==-1){
							lastValidHighPrioFrameArray=colorArrayResult;
							lastValidHighPrioMessageTime=new Date().getTime();
						}
						else{
							lastValidFrameArray=colorArrayResult;
							lastValidMessageTime=new Date().getTime();
						}
					}
					else{
						console.log("-------------- MESSAGE NOT VALID ------------------------")
					}
				}	
			}
			else{
				console.log("udp message format not valid")
			}
			
		}
		else{
			console.log("udp message does not contain secret header")
		}
	}
	
	this.active=function(){
		var a = new Date();
		var b = new Date(lastValidMessageTime);
		if(Math.abs((a - b) / 1000) < udpActiveTimeInSeconds){
			return true;
		}
		var b = new Date(lastValidHighPrioMessageTime);
		if(Math.abs((a - b) / 1000) < udpActiveTimeInSeconds){
			return true;
		}
				
		return false;
	}
	
	this.getLastValidFrameArray=function(){
		//check if there was a high prio frame
		var a = new Date();
		var b = new Date(lastValidHighPrioMessageTime);
		//if there was a high prio frame send by udp in the last 5 seconds return the high prio frame
		if(Math.abs((a - b) / 1000) < 5){
			return lastValidHighPrioMessageTime;
		}
		//else return the last valid frame
		return lastValidFrameArray;
	}
	
}


/*
**************************************************************************************
*	EXPRESS WEBAPP COMMUNICATION
**************************************************************************************
*/

var express = require('express.io');
var app = express();

var animationManager=new AnimationManagerObj();
var udpMessageManager= new udpMessageManager();
//var player=new PlayerObj(tcpSocketManager,animationManager);
var clientsManager=new clientsManagerObj();
var tcpSocketManager=new TcpSocketManagerObj(clientsManager);
udpMessageManager.init();
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
	
	if(DEBUGMODE)
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
