//enable socet io
io = io.connect()
//process incomming io Events
addIoEvents();

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

	//add Gesture Recognition on action area
	startGestureRecognizer();
	
  });

var TOO_FAR_AWAY = 10.0; //distance in KM where we ignore the user
var WINDOW_OFFSET = 0; //max. 16! positive or negativ to shift the Start-Window away from East ( positive = towards north, negativ = towards south)
var SPLASH3_TEXT = ["Bewege deinen Finger vertikal um die Helligkeit einzustellen.","Tappe 2 mal um ein Blinken auszusenden.","Bewege deinen Finger horizontal um dein Pixel um den Turm laufen zu lassen."]

var user_position = null;
var user_dist = null;
var prefered_user_window = null; 
var prefered_user_color = null;
var splash3_hint = 0;
  	// Windownumber
  	// North  12
	// West 8 . 0 East 
	// South  4
var color_percent = 0.5;
	
function addIoEvents(){
	//testMessage
	// io.emit('processGesture',{"name":"myGesture","options":[]});
	
	//error Message
	io.on('error', function(data) {
		console.log(data);
	})  
	//success Message
	io.on('success', function(data) {
		console.log(data);
	})  
	
	
	io.on('windowinUse', function(data) {
		//todo: window already used
	})  
	io.on('gestureAnimationFinished', function(data) {
		//todo: gestureAnimationFinished
	})  
}	

// Io Calls When the User Made Selections
function ioSendCurrentWindowNumber (inWindownumber) {
	console.log("current window number: "+inWindownumber);
	io.emit('selectWindowNumber',inWindownumber);
}

function ioSendFinalWindowNumber (inWindownumber) {
	console.log("final window number: "+inWindownumber);
	io.emit('selectWindowNumberFinal',inWindownumber);
}

function ioSendCurrentWindowColor (inWindowcolor) {
	console.log("current window color: "+inWindowcolor);
	io.emit('selectWindowColor',inWindowcolor);
}

function ioSendFinalWindowColor (inWindowcolor) {
	console.log("final window color: "+inWindowcolor);
	io.emit('selectWindowColorFinal',inWindowcolor);
}
// gesture type: tap
GESTURETYPES = {
    DOUBLETAP : 0,
    SWIPE_LEFT : 1,
    SWIPE_RIGHT: 2,
    DRAG_UP: 3,
    DRAG_DOWN: 4
}

function ioSendGesture (inGestureType,inColor) {
	console.log("we have a gesture:"+inGestureType);
	io.emit('processGesture',{"name":inGestureType});
}

var mc = null;

function startGestureRecognizer(){

	//prevent site from scrolling when touching the actionarea
	$("#actionArea").on('touchstart', function (evt) {
		evt.preventDefault();
	});
	
	//add Hammer JS to actionArea
	var actionArea = document.getElementById('actionArea');
	mc = new Hammer(actionArea);

	// SWIPE LEFT / RIGHT GESTURE!
	mc.on("panleft panright", function(event) {
		if(event.eventType == 4) // Gesture Ended
		{
			if( splash3_hint == 2)
				setSplash3To(3);

			if( event.deltaX > 0)
				ioSendGesture(GESTURETYPES.SWIPE_RIGHT,prefered_user_color);
			else
				ioSendGesture(GESTURETYPES.SWIPE_LEFT,prefered_user_color);
		}
	});
	// DRAG UP / DOWN GESTURE!
	mc.on("panup pandown", function(event) {
		if( splash3_hint == 0)
			setSplash3To(1);
		//continous Color fading between prefered_color and Black ( 1.0 ) and White ( 0.0 )
		color_percent += parseFloat(event.deltaY)/8000.0;  
		var tmpColor = computeColor();

		if( event.deltaY > 0)
		{
			ioSendGesture(GESTURETYPES.DRAG_DOWN,tmpColor);
		}
		else
			ioSendGesture(GESTURETYPES.DRAG_UP,tmpColor);
	});
	// DOUBLE TAP GESTURE!
	mc.on("doubletap", function(event) {
		if(event.eventType == 4) // Gesture Ended
		{
			if( splash3_hint == 1)
				setSplash3To(2);
		}
		//Reset Color
		color_percent = 0.5;
		ioSendGesture(GESTURETYPES.DOUBLETAP,prefered_user_color);
	});
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
function startSituation(){
	//STEP 1
	$( "#step1" ).fadeIn();
	$( "#step2" ).hide();
    $( "#step3" ).hide();
    $("#highlight").hide();
    prohibit_btn_step1();;
	$( "#splash1" ).addClass("hidden");
	$( "#splash1" ).removeClass("shown");
	$( "#splash1" ).addClass("darkcolor");
	$( "#splash1" ).removeClass("specialcolor");
	user_position = null;
	user_dist = null;
	prefered_user_window = null; 
	//STEP 2
	var prefered_user_color = null;
	prohibit_btn_step2
	$( "#splash2" ).addClass("hidden");
	$( "#splash2" ).removeClass("shown");
	$( "#splash2" ).addClass("darkcolor");
	$( "#splash2" ).removeClass("specialcolor");
	//STEP 3
	splash3_hint = 0;
	setSplash3To(0);
	color_percent = 0.5;

}

function allow_btn_step1(){
	$("#stepButton1" ).removeClass("darkcolor");
	$("#stepButton1" ).addClass("color");
}
function prohibit_btn_step1(){
	$("#stepButton1" ).addClass("darkcolor");
	$("#stepButton1" ).removeClass("color");
}
function allow_btn_step2(){
	$("#stepButton2" ).removeClass("darkcolor");
	$("#stepButton2" ).addClass("color");
}
function prohibit_btn_step2(){
	$("#stepButton2" ).addClass("darkcolor");
	$("#stepButton2" ).removeClass("color");
}

function btn_weiter_step1() {
	if( prefered_user_window == null)
	{
		$( "#splash1" ).removeClass("hidden");
		$( "#splash1" ).removeClass("darkcolor");
		$( "#splash1" ).addClass("shown");
		$( "#splash1" ).addClass("specialcolor");
		$( "#splash1" ).html("Markiere deinen Standort auf der Karte oder klicke den GPS-Button.");
		return;
	}
	ioSendFinalWindowNumber(prefered_user_window);
	$( "#step1" ).hide();
	$( "#step2" ).fadeIn();
	$( "#step3" ).hide();
}

function btn_weiter_step2() {
	if( prefered_user_window == null)
	{
		$( "#splash2" ).removeClass("hidden");
		$( "#splash2" ).removeClass("darkcolor");
		$( "#splash2" ).addClass("shown");
		$( "#splash2" ).addClass("specialcolor");
		$( "#splash2" ).html("Markiere deinen Standort auf der Karte oder klicke den GPS-Button.");
		return;
	}
	ioSendFinalWindowColor(prefered_user_color);
	$( "#step1" ).hide();
	$( "#step2" ).hide();
	$( "#step3" ).fadeIn();
}

function selectColor(e,inColor){
	// compute the HexValue
	var rgbArray = getRGB(inColor)
	var hexValue = rgbToHex(rgbArray[0],rgbArray[1],rgbArray[2])

	// Show the Splash
	$( "#splash2" ).removeClass("hidden");
	$( "#splash2" ).addClass("shown");
	$( "#splash2" ).html(" Gute Wahl.");
	$( "#splash2" ).css({background: inColor});

	// Set the Color als prefered
	prefered_user_color = hexValue;

	//Send Current prefered Color to Socket
	ioSendCurrentWindowColor(prefered_user_color);
}

function clickOnImage(e, inOffset){
	var onPicX = (e.pageX-inOffset.left);
	var onPicY = (e.pageY-inOffset.top);
	
	if( (Math.pow(320.0-onPicX,2)+Math.pow(320-onPicY,2))<900) //dont allow middle!
		return; 

	$("#highlight").show();
    $("#highlight").css({position: "absolute", top: (e.pageY-10), left: (e.pageX-10)});

	var angle = Math.atan2((onPicX-320),(onPicY-320));
	angle = angle*180/Math.PI;
	angle+=90;

	prefered_user_window = computeWindowFromAngle(parseFloat(angle));
	allow_btn_step1();
	$( "#splash1" ).removeClass("hidden");
	$( "#splash1" ).addClass("shown");
	$( "#splash1" ).addClass("darkcolor");
	$( "#splash1" ).removeClass("specialcolor");
	$( "#splash1" ).html(" Ah ja, da drüben! Ich kann dich sehen.");

	ioSendCurrentWindowNumber(prefered_user_window);
}

/********************* GPS STUFF ************************/
function getLocation() {
	//set everything back
	prohibit_btn_step1();
	prefered_user_window = null;
	$("#highlight").hide();

	$( "#splash1" ).removeClass("hidden");
	$( "#splash1" ).addClass("shown");
	$( "#splash1" ).addClass("darkcolor");
	$( "#splash1" ).removeClass("specialcolor");
    if (geoPosition.init()) {
	  geoPosition.getCurrentPosition(geoSuccess, geoError);
	}
}

function geoSuccess(p) {

  user_position = p;
  computeUserAndTower();
  if( user_dist != null )
  	setDistanceSplash();

  if ( prefered_user_window != null )
  	allow_btn_step1();
}
function geoError() {
   $( "#splash1" ).html("Deine Position konnte nicht ermittelt werden.");
}
function setDistanceSplash()
{
	if( user_dist > TOO_FAR_AWAY)
		$( "#splash1" ).html("Komm näher! Du bist "+parseFloat(user_dist).toFixed(1)+"km weit vom Turm entfernt.");
	else
	{
		if ( user_dist < 1.0)
			$( "#splash1" ).html("Erfolg! Du stehst nur "+parseFloat(user_dist*1000.0).toFixed(0)+"m vom Turm entfernt.");
		else	
			$( "#splash1" ).html("Erfolg! Du stehst "+parseFloat(user_dist).toFixed(1)+"km vom Turm entfernt.");

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
	// North -90
	// West 0 . 180 East 
	// South 90
  	prefered_user_window = computeWindowFromAngle(angle);
}

function computeWindowFromAngle(inAngle){
	inAngle *= -1;
	inAngle += 180;
	var windownumber = parseInt(Math.round(inAngle/22.5));
	windownumber += WINDOW_OFFSET+16;
	windownumber = windownumber%16
	return windownumber;
	// Windownumber
  	// North  12
	// West 8 . 0 East 
	// South  4
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

	switch(newState) {
	    case 0:
	        $( "#splash3" ).removeClass("hidden");
			$( "#splash3" ).addClass("shown");
	        $( "#splash3" ).html(SPLASH3_TEXT[0]);
	        break;
	    case 1:
	        $( "#splash3" ).removeClass("hidden");
			$( "#splash3" ).addClass("shown");
	        $( "#splash3" ).html(SPLASH3_TEXT[1]);
	        break;
	    case 2:
	        $( "#splash3" ).removeClass("hidden");
			$( "#splash3" ).addClass("shown");
	        $( "#splash3" ).html(SPLASH3_TEXT[2]);
	        break;
	    default:
	        $( "#splash3" ).addClass("hidden");
			$( "#splash3" ).removeClass("shown");
	}

	splash3_hint = newState;
}
