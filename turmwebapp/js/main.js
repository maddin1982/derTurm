


// BEWARE! this call is for the old socket.io API (<1.0)

// builds target URL for socket.io: take host and path, strip everything behind the last slash from path
io = io.connect( '//'+location.host, { resource: location.pathname.replace( /\/(.*?)[^\/]+$/, '$1' )+'socket.io' } );

// there are browsers without console – don't let them die
if ( typeof console == 'undefined' )
{
	// define pseudo console with no-op functions
	window.console = {
		log: function(){},
		info: function(){},
		warn: function(){},
		error: function(){}
	};
}


//process incomming io Events
addIoEvents();

var lastSecretGestureSend=new Date();

//gesture feedback for action area
var gfb;
$( window ).load(function() {
	alignMapAndOverlay();
 });

$( document ).ready(function() {
	
	//prevent Map from dragging
	$("#mapImg").on('dragstart', function(event) { event.preventDefault(); });

	//Set Input-handlers on Map
	$("#mapImg").on("click", function(event) { clickOnImage(event, $(this).offset()); });
	$("#mapImg").on("tap", function(event) { clickOnImage(event, $(this).offset()); });

	//Set Input-handlers on Colorselectors
	$(".colorselector").on("click", function(event) { var color = $( this ).css( "background-color" ); selectColor(event,color); });
	$(".colorselector").on("tap", function(event) { var color = $( this ).css( "background-color" ); selectColor(event,color); });

	//Set Start Situation of StepWizard
    startSituation();
	startGestureRecognizer();

	gfb = new GestureFeedback();
	gfb.init();
	
  });

var TOO_FAR_AWAY = 2.0; //distance in KM where we ignore the user
var WINDOW_OFFSET = 7; //max. 16! positive or negativ to shift the Start-Window away from East ( positive = towards north, negativ = towards south)
	// Windownumber
  	// North    0(+7)
	// West 4(+7) . 12(+7) East 
	// South    8(+7)
var SPLASH2_TEXT = ["Gute Wahl.","Super.","Gefällt mir auch.","Schön.","Toll.","Klasse.","Wow.","Kräftig.","Gefällt.","Ja, die passt.","Sehr gut.","Gut gemacht.","Herrlich.","Sieht gut aus.", "Naja.", "Ok.","Perfekt."]
var SPLASH3_TEXT = ["Bewege deinen Finger vertikal um die Farbe umzustellen.","Bewege 2 Finger vertikal um die Helligkeit einzustellen.","Tappe 2 mal um ein Leuchten auszusenden.","Bewege deinen Finger horizontal um dein Pixel um den Turm laufen zu lassen."]
var WINDOW_ANGLE = -101.25; // window = 0 has this Angle

var current_step = 1;
var user_position = null;
var user_dist = null;
var prefered_user_window = null; 
var final_user_window = null; 
var prefered_user_color = null;
var splash3_hint = 0;
var	app_error = false;

var color_percent = 0.5;
var mc = null;

var my_zoom = 0;
var my_zoom_f = 0;
var my_zoom_max_t = 4200;
var my_zoom_stepback_t = 200;
var my_zoom_stepback_to = null;
var win_num = 16;

function addIoEvents(){
	
	//testMessage
	// io.emit('processGesture',{"name":"myGesture","options":[]});
	io.on("connect_failed", function(data) {
		console.log(data);
		showAlert("specialcolor","Es konnte keine Socket Verbindung hergestellt werden.");
		$( "#error").html(JSON.stringify(data));
		/*app_error = true;
		//Set all Elements faded out! execept the splash!
		$("div[class*='col']:not(.splash)").css("opacity",0.2);*/
		return;
	});  
	
	//generic error Message
	io.on('error', function(data) {
		console.log(data);
		showAlert("specialcolor","Es ist ein unerwarteter Fehler aufgetreten.");
		app_error = true;
		$( "#error").html(JSON.stringify(data));
		//Set all Elements faded out! execept the splash!
		$("div[class*='col']:not(.splash)").css("opacity",0.2);
		return;
	});  
	//generic success Message
	io.on('success', function(data) {
		console.log(data);
	});  

	io.on('connectionToTowerFailed', function(data) {
		showAlert("specialcolor","Ich habe gerade leichte Verbindungsprobleme. "+data);
		// irgendwas stimmt mit der tcp verbindung nicht
	})

	
	io.on('windowAssigned', function(WindowId) {
		//fenster konnte zugewiesen werden
		if( prefered_user_window == WindowId)
		{
			rotateOverlay(WINDOW_ANGLE+prefered_user_window*-22.5);
			showAlert("darkcolor","Das Fenster gehört nun Dir!");
			allow_btn_step1();
			final_user_window = WindowId;
			return;
		}
		// kein Fenster zugewiesen
		if ( WindowId < 0)
		{
			var tmpUP = user_position;
			var tmpDist = user_dist;
			startSituation();
			showAlert("specialcolor","Derzeit sind keine Fenster in deiner Richtung frei.");
			user_position = tmpUP
			user_dist = tmpDist;
			final_user_window = null;
		}
		else 
		{
			final_user_window = WindowId;
			rotateOverlay(WINDOW_ANGLE+WindowId*-22.5);
			showAlert("darkcolor","Das Fenster welches in deine Richtung zeigt ist besetzt. Du hast Das daneben bekommen.");
			allow_btn_step1();
		}
	});  

	io.on('timeout', function(data) {
		//reset the App
		startSituation();
		//show that you were timed out
		showAlert("specialcolor","Du warst jetzt länger inaktiv. Wähle bitte erneut ein Fenster.");		
	});  
}	

// Io Calls When the User Made Selections
function ioSendCurrentWindowNumber (inWindownumber) {
	console.log("current window number: "+inWindownumber);
	$( "#error").html("current window number: "+inWindownumber);
	io.emit('selectWindowNumber',inWindownumber);
}

function ioSendFinalWindowNumber (inWindownumber) {
	console.log("final window number: "+inWindownumber);
	$( "#error").html("final window number: "+inWindownumber);
	io.emit('selectWindowNumberFinal',inWindownumber);
}

function ioSendCurrentWindowColor (inWindowcolor) {
	console.log("current window color: "+inWindowcolor);
	$( "#error").html("current window color: "+inWindowcolor);
	io.emit('selectWindowColor',inWindowcolor);
}

function ioSendFinalWindowColor (inWindowcolor) {
	console.log("final window color: "+inWindowcolor);
	$( "#error").html("final window color: "+inWindowcolor);
	io.emit('selectWindowColorFinal',inWindowcolor);
}



// gesture type: tap
GESTURETYPES = {
		DOUBLETAP : 0,
		SWIPE_LEFT : 1,
		SWIPE_RIGHT: 2,
		DRAG_UP: 3,
		DRAG_DOWN: 4,
		ZOOM_OUT: 5,
		ZOOM_IN: 6,
		CHECK: 7,
		PIGTAIL: 8
}

// function sendHidden1DollarGesture(gesture){
	// lastSecretGestureSend=new Date();
	// $( "#error").html("we have a hidden gesture: "+gesture.Name);
	// io.emit('processHiddenGesture',{"gesture":gesture});
// }

function ioSendGesture (inGestureType,inVelocity) {
	if((new Date()-lastSecretGestureSend)>20){
		$( "#error").html("we have a gesture:"+inGestureType+" velocity:"+inVelocity);
		io.emit('processGesture',{"type":inGestureType,"velocity":inVelocity});
	}

}

function startGestureRecognizer(){

	//1$recognizer
	var dollarRecognizer= new my1DollarRecognizer();
	dollarRecognizer.init($("#actionArea"));

	//prevent site from scrolling when touching the actionarea
	// $("#actionArea").on('touchstart', function (evt) {
		// evt.preventDefault();
	// });
	
	//add Hammer JS to actionArea
	var actionArea = document.getElementById('actionArea');
	mc = new Hammer(actionArea);

	//mc.get('tap').set({ taps:2,interval:500, time:500, posThreshold:50 });

	mc.get('pan').set({ threshold: 0, pointers: 2,direction: Hammer.DIRECTION_VERTICAL });
	
	
	dollarRecognizer.on("pigtail",function(){
	    console.log("pigtail");
		ioSendGesture(GESTURETYPES.PIGTAIL);
	})

	dollarRecognizer.on("check",function(){
	   console.log("check");
		ioSendGesture(GESTURETYPES.CHECK);
	})

	// mc.on("swipeleft swiperight", function(event) {
		// if( splash3_hint == 2)
			// setSplash3To(3);
		// //console.log(event)
		// //compute Velocity
		 // var tmpVelo = event.velocity/15;
		 // tmpVelo = Math.abs(tmpVelo); 
		 // if(tmpVelo > 1.0)
			 // tmpVelo = 1.0;
		// if(event.deltaX<0){
			// ioSendGesture(GESTURETYPES.SWIPE_LEFT,tmpVelo);
			// gfb.rotate_left(tmpVelo);
		// }
		// else{
			// ioSendGesture(GESTURETYPES.SWIPE_RIGHT,tmpVelo);
			// gfb.rotate_right(tmpVelo);
		// }
	// });	
	
	dollarRecognizer.on("verticalSwipe",function(data){
		console.log("verticalSwipe");
		console.log(data);
		
		//TODO: change color and send it to backend !!!
		//var COLOR_SELECTION = ["#002AD1","#082F97","#03484D","#00BFCC","#8F0E97","#630D8D","#330220","#D10052","#8D1800","#97270E","#8D520D","#CCA20A","#F0D10C","#579E10","#1A8012","#043300","#008458","#BC5FD1","#759E4C","#404D84","#E5E5E4","#D9625E"];

		colorarray=["#002AD1","#082F97","#03484D","#00bfcc","#8f0e97","#630d8d","#330220","#d10052","#8d1800","#97270e","#8d520d","#cca20a","#f0d10c","#579e10","#1a8012","#043300","#008458","#bc5fd1","#759e4c","#404d84","#e5e5e4","#d9625e"]
		
		var position=$.inArray(prefered_user_color,colorarray);
		position=position==-1?0:position;
		
		var newposition=position+data.direction;
		if(newposition<0)newposition=colorarray.length-1;
		if(newposition>(colorarray.length-1))newposition=0;
		
		prefered_user_color = colorarray[newposition];
		ioSendCurrentWindowColor(prefered_user_color);

		if( splash3_hint == 0)
			setSplash3To(1);

		gfb.updatecolor(prefered_user_color);
		setActionAreaHighlight(prefered_user_color);
	});
	
	
	dollarRecognizer.on("horizontalSwipe",function(data){
		//console.log("dollar_swipe "+ speed)
		
		if( splash3_hint == 3)
			setSplash3To(4);
		//console.log(event)
		//compute Velocity
		 var tmpVelo = data.velocity/5;
		 tmpVelo = Math.abs(tmpVelo); 
		 if(tmpVelo > 1.0)
			 tmpVelo = 1.0;
		if(data.direction<0){
			ioSendGesture(GESTURETYPES.SWIPE_LEFT,tmpVelo);
			gfb.rotate_left(tmpVelo);
		}
		else{
			ioSendGesture(GESTURETYPES.SWIPE_RIGHT,tmpVelo);
			gfb.rotate_right(tmpVelo);
		}
	});
	
	dollarRecognizer.on("doubleTap",function(){
		//console.log("dollar_doubleTap")
	
		if( splash3_hint == 2)
			setSplash3To(3);

		//Reset Color
		color_percent = 0.5;
		ioSendGesture(GESTURETYPES.DOUBLETAP);
		ioSendCurrentWindowColor(prefered_user_color);
		setActionAreaHighlight(prefered_user_color);
		gfb.updatecolor(prefered_user_color);
		gfb.blink();
	});
	
	/*
	mc.on("swipeleft swiperight", function(event) {
		if( splash3_hint == 2)
			setSplash3To(3);
		//console.log(event)
		//compute Velocity
		 var tmpVelo = event.velocity/15;
		 tmpVelo = Math.abs(tmpVelo); 
		 if(tmpVelo > 1.0)
			 tmpVelo = 1.0;
		if(event.deltaX<0){
			ioSendGesture(GESTURETYPES.SWIPE_LEFT,tmpVelo);
			gfb.rotate_left(tmpVelo);
		}
		else{
			ioSendGesture(GESTURETYPES.SWIPE_RIGHT,tmpVelo);
			gfb.rotate_right(tmpVelo);
		}
	});	
	*/
	
	
	// DOUBLE TOUCH PAN UP AND DOWN GESTURE!
	mc.on("pan", function(event) {
		if( splash3_hint == 1)
			setSplash3To(2);
		//continous Color fading between prefered_color and Black ( 1.0 ) and White ( 0.0 )
		color_percent += parseFloat(event.deltaY)/8000.0;  
		var tmpColor = computeColor();
		//send new WindowColors to Socket
		ioSendCurrentWindowColor(tmpColor);
		setActionAreaHighlight(tmpColor);
		gfb.updatecolor(tmpColor);
	});
	
	/*
	// MODIFIED TAP GESTURE (doubletap)!
	mc.on("tap", function(event) {
		if(event.eventType == 4) // Gesture Ended
		{
			if( splash3_hint == 1)
				setSplash3To(2);
		}
		//Reset Color
		color_percent = 0.5;
		ioSendGesture(GESTURETYPES.DOUBLETAP);
		ioSendCurrentWindowColor(prefered_user_color);
		setActionAreaHighlight(prefered_user_color);
		gfb.updatecolor(prefered_user_color);
		gfb.blink();
	}); */

	//ZOOM GESTURE
	// mc.get('pinch').set({ enable: true });
	// mc.on("pinchin", function(event) {
		// zoom_out(event.scale);
	// });
	// mc.on("pinchout", function(event) {
		// zoom_in(event.scale);
	// });
	// mc.on("pinchend", function(event) {
		// zoom_end();
	// });
}	

function setActionAreaHighlight(inColor)
{
	$( ".actionarea").css('border-color', inColor);
}

function computeColor(){
	var init = getRGB(prefered_user_color);
	if ( color_percent == 0.5)
		return (prefered_user_color);

	if(color_percent > 1.0)
		color_percent = 1.0;
	if(color_percent < 0.0)
		color_percent = 0.0;

	var tmp = color_percent;
	if( tmp > 0.5)
	{
		tmp *= 2; // 1.0 ... 2.0
		tmp -= 1; // 0.0 ... 1.0
		init[0] *= (1.0-tmp);
		init[0] += 0*tmp;
		init[0] = parseInt(init[0]);
		init[1] *= (1.0-tmp);
		init[1] += 0*tmp;
		init[1] = parseInt(init[1]);
		init[2] *= (1.0-tmp);
		init[2] += 0*tmp;
		init[2] = parseInt(init[2]);
	}
	else if( tmp < 0.5)
	{
		tmp *= -2; // 0.0 ... -1.0
		tmp += 1;
		init[0] *= (1.0-tmp);
		init[0] += 255*tmp;
		init[0] = parseInt(init[0]);
		init[1] *= (1.0-tmp);
		init[1] += 255*tmp;
		init[1] = parseInt(init[1]);
		init[2] *= (1.0-tmp);
		init[2] += 255*tmp;
		init[2] = parseInt(init[2]);
	}
	return rgbToHex(init[0],init[1],init[2]);
}
function alignMapAndOverlay(){
		$("#heightlimiter").css('height', $("#mapImg").width()-8 + 'px');
		$("#overlay").css('top', '-'+$("#mapImg").height()+'px');
	}
$( window ).resize(function() {
	alignMapAndOverlay();
	});
function startSituation(){

	//STEP 1
	$( "#overlay" ).css({opacity: 0.0});
	current_step = 1
	app_error = false;
	$( "#step1" ).fadeIn();
	$( "#step2" ).hide();
    $( "#step3" ).hide();
    $("#highlight").hide();
    prohibit_btn_step1();
    hideAlert(1);
	user_position = null;
	user_dist = null;
	prefered_user_window = null; 
	final_user_window = null;
	alignMapAndOverlay();
	//STEP 2
	prefered_user_color = null;
	prohibit_btn_step2();
	hideAlert(2);
	//STEP 3
	splash3_hint = 0;
	hideAlert(3);
	color_percent = 0.5;
	$( ".logocol").removeClass("hidden");

	if( isMobile.iOS() ) {
		showAlert("darkcolor","GPS funktioniert auf deinem Gerät nur wenn du in den Einstellungen unter \"Datenschutz\" die \"Ortungsdienste\" aktiviert hast!");
	}
}

function allow_btn_step1(){
	if( app_error )
		return;

	$("#stepButton1" ).removeClass("darkcolor");
	$("#stepButton1" ).addClass("color");
}
function prohibit_btn_step1(){
	$("#stepButton1" ).addClass("darkcolor");
	$("#stepButton1" ).removeClass("color");
}
function allow_btn_step2(){
	if( app_error )
		return;

	$("#stepButton2" ).removeClass("darkcolor");
	$("#stepButton2" ).addClass("color");
}
function prohibit_btn_step2(){
	$("#stepButton2" ).addClass("darkcolor");
	$("#stepButton2" ).removeClass("color");
}

function btn_weiter_step1() {
	if( app_error )
		return;

	if( final_user_window == null)
	{
		showAlert("specialcolor","Markiere deinen Standort auf der Karte oder klicke den GPS-Button.");
		return;
	}
	current_step = 2;
	ioSendFinalWindowNumber(final_user_window);
	$( "#step1" ).hide();
	$( "#step2" ).fadeIn();
	$( "#step3" ).hide();
}

function btn_weiter_step2() {
	if( app_error )
		return;

	if( prefered_user_color == null)
	{
		showAlert("specialcolor","Wähle eine Farbe aus. Mir gefällt grün.");
		return;
	}
	current_step = 3;
	ioSendFinalWindowColor(prefered_user_color);
	$( "#step1" ).hide();
	$( "#step2" ).hide();
	$( "#step3" ).fadeIn();
	//$( ".logocol").addClass("hidden");
	splash3_hint = 1;
	setSplash3To(0);
	setActionAreaHighlight(prefered_user_color);
	gfb.updatecolor(prefered_user_color);
}

function selectColor(e,inColor){
	if( app_error )
		return;

	// compute the HexValue
	var rgbArray = getRGB(inColor)
	var hexValue = rgbToHex(rgbArray[0],rgbArray[1],rgbArray[2])

	// Show the Splash
	showAlert("darkcolor",SPLASH2_TEXT[Math.floor(Math.random()*SPLASH2_TEXT.length)]);
	$( "#splash2" ).css({background: inColor});

	// Set the Color als prefered
	prefered_user_color = hexValue;
	allow_btn_step2();
	//Send Current prefered Color to Socket
	ioSendCurrentWindowColor(prefered_user_color);
}
function rotateOverlay(inAngle)
{	
	$( "#overlay" ).css({opacity: 0.3});
	$( "#overlay" ).css({ WebkitTransform: 'rotate(' + inAngle + 'deg)'});/* Chrome, Safari, Opera */
    $( "#overlay" ).css({ '-moz-transform': 'rotate(' + inAngle + 'deg)'});
}
function clickOnImage(e, inOffset){

	if( app_error )
		return;

	var onPicX = (e.pageX-inOffset.left);
	var onPicY = (e.pageY-inOffset.top);
	
	if( (Math.pow(320.0-onPicX,2)+Math.pow(320-onPicY,2))<900) //dont allow middle!
		return; 
	
	$("#highlight").show();
    $("#highlight").css({position: "absolute", top: (e.pageY-10), left: (e.pageX-10)});

	var angle = Math.atan2((onPicX-$("#mapImg").width()/2),(onPicY-$("#mapImg").height()/2));
	angle = angle*180/Math.PI;
	// Windowangle
  	// North  -180
	// West -90. 90 East 
	// South   0
	
	prefered_user_window = computeWindowFromAngle(parseFloat(angle));
	showAlert("darkcolor"," Mal sehen ob das Fenster frei ist.");
	ioSendCurrentWindowNumber(prefered_user_window);
	//rotateOverlay(WINDOW_ANGLE+prefered_user_window*-22.5);
}
function hideAlert(inSplashNumber)
{
	inSplashNumber = typeof inSplashNumber !== 'undefined' ? inSplashNumber : current_step;

	$( "#splash"+inSplashNumber  ).removeClass("darkcolor");
	$( "#splash"+inSplashNumber  ).removeClass("specialcolor");
	$( "#splash"+inSplashNumber  ).removeClass("color");
	$( "#splash"+inSplashNumber  ).removeClass("shown");
	$( "#splash"+inSplashNumber  ).css( "background", "" );

	$( "#splash"+inSplashNumber  ).addClass("hidden");
	$( "#splash"+inSplashNumber  ).html("");
}

function showAlert(inColor,inText,inSplashNumber)
{
	if( app_error )
		return;
	//default value is currentStep
	inSplashNumber = typeof inSplashNumber !== 'undefined' ? inSplashNumber : current_step;
	//reset it
	$( "#splash"+inSplashNumber  ).removeClass("hidden");
	$( "#splash"+inSplashNumber  ).removeClass("darkcolor");
	$( "#splash"+inSplashNumber  ).removeClass("specialcolor");
	$( "#splash"+inSplashNumber  ).removeClass("color");
	//now skin it
	$( "#splash"+inSplashNumber  ).addClass("shown");
	$( "#splash"+inSplashNumber  ).addClass(inColor);
	$( "#splash"+inSplashNumber  ).html(inText);
}
/********************* GPS STUFF ************************/
function getLocation() {
	$( "#overlay" ).css({opacity: 0.0});
	//set everything back
	prohibit_btn_step1();
	prefered_user_window = null;
	final_user_window = null;
	$("#highlight").hide();


    if (geoPosition.init()) {
	  geoPosition.getCurrentPosition(geoSuccess, geoError);
	}
}

function geoSuccess(p) {

  user_position = p;
  computeUserAndTower();
  if( user_dist != null )
  	setDistanceSplash();
}
function geoError() {
	showAlert("darkcolor","Deine Position konnte nicht ermittelt werden.");
}
function setDistanceSplash()
{
	if( user_dist > TOO_FAR_AWAY)
		showAlert("specialcolor","Komm näher! Du bist "+parseFloat(user_dist).toFixed(1)+"km weit vom Turm entfernt.");
	else
	{
		if ( user_dist < 1.0)
			showAlert("darkcolor","Erfolg! Du stehst nur "+parseFloat(user_dist*1000.0).toFixed(0)+"m vom Turm entfernt.");
		else	
			showAlert("darkcolor","Erfolg! Du stehst "+parseFloat(user_dist).toFixed(1)+"km vom Turm entfernt.");

		// send the computed Window Number to the Socket
		ioSendCurrentWindowNumber(prefered_user_window);
	}
}
function computeUserAndTower()
{ 
	var tower_position = {latitude:51.042024, longitude: 13.797774};
	user_dist = gpsDistance(user_position.coords.longitude,
						user_position.coords.latitude,						
						tower_position.longitude,
						tower_position.latitude);
	
	var angle = gpsAngle(user_position.coords.longitude,
						user_position.coords.latitude,						
						tower_position.longitude,
						tower_position.latitude);
  	prefered_user_window = computeWindowFromAngle(angle-90);
  	//rotateOverlay(WINDOW_ANGLE+prefered_user_window*-22.5);
}

function computeWindowFromAngle(inAngle){
	inAngle += 180;
	var windownumber = parseInt(Math.round(inAngle/22.5));
	windownumber += WINDOW_OFFSET+16;
	windownumber = windownumber%16
	return windownumber;
	// Windownumber
  	// North  4
	// West 8 . 0 East 
	// South  12
}

function gpsDistance(lon1, lat1, lon2, lat2) {
	var R = 6371; // Radius of the earth in km
	var dLat = rad(lat2-lat1);  // Javascript functions in radians
	var dLon = rad(lon2-lon1); 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	  Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * 
	  Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}

 function rad(x){ 
 	return x * Math.PI / 180;
 }

 function gpsAngle(long1, lat1, long2, lat2){
 	var dy = lat2 - lat1;
	var dx = Math.cos(Math.PI / 180 * lat1)*(long2 - long1);
	var angle = Math.atan2(dy, dx);
	return angle*180/Math.PI;
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
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function setSplash3To(newState)
{
	if(splash3_hint == newState)
		return;

	if( newState >= 0 && newState<4) // 0,1,2,3
	   showAlert("darkcolor",SPLASH3_TEXT[newState]);
	else
		hideAlert();

	splash3_hint = newState;
}

function zoom_out(scale) {
	my_zoom_f -= 0.3;
	var zoom_tmp = Math.max(0,Math.min(parseInt(my_zoom_f),parseInt(win_num/2)));
	if(zoom_tmp !== my_zoom) {
		my_zoom = zoom_tmp;
		ioSendGesture(GESTURETYPES.ZOOM_OUT);
		gfb.setZoom(my_zoom);
	}
}

function zoom_in(scale) {
	my_zoom_f += 0.3;
	var zoom_tmp = Math.max(0,Math.min(parseInt(my_zoom_f),parseInt(win_num/2)));
	if(zoom_tmp !== my_zoom) {
		my_zoom = zoom_tmp;
		ioSendGesture(GESTURETYPES.ZOOM_IN);
		gfb.setZoom(my_zoom);
	}
}

function zoom_end() {
	setTimeout(function() {
		clearTimeout(my_zoom_stepback_to);
		zoom_stepback();
	}, my_zoom_max_t);
}

function zoom_stepback() {
	if(my_zoom > 0) {
		my_zoom -= 1;
		ioSendGesture(GESTURETYPES.ZOOM_OUT);
		gfb.setZoom(my_zoom);
		my_zoom_stepback_to = setTimeout(function() {zoom_stepback();}, my_zoom_stepback_t);
	}
	my_zoom_f = my_zoom;
}

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};