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
var WINDOW_OFFSET = -4; //max. 16! positive or negativ to shift the Start-Window away from East ( positive = towards north, negativ = towards south)
	// Windownumber
  	// North    12(-4)
	// West 8(-4) . 0(-4) East 
	// South    4(-4)
var SPLASH3_TEXT = ["Bewege deinen Finger vertikal um die Helligkeit einzustellen.","Tappe 2 mal um ein Blinken auszusenden.","Bewege deinen Finger horizontal um dein Pixel um den Turm laufen zu lassen."]

var current_step = 1;
var user_position = null;
var user_dist = null;
var prefered_user_window = null; 
var prefered_user_color = null;
var splash3_hint = 0;
var	app_error = false;

var color_percent = 0.5;
var mc = null;

function addIoEvents(){
	//testMessage
	// io.emit('processGesture',{"name":"myGesture","options":[]});
	
	//generic error Message
	io.on('error', function(data) {
		console.log(data);
	})  
	//generic success Message
	io.on('success', function(data) {
		console.log(data);
	})  

	io.on('connectionToTowerFailed', function(data) {
		showAlert("specialcolor","Ich habe gerade leichte Verbindungsprobleme.");
		// irgendwas stimmt mit der tcp verbindung nicht
	})
	
	io.on('windowAssigned', function(WindowId) {
		//fenster konnte zugewiesen werden
		//wenn fenster nicht frei gib maximal 3 fenster in beide richtungen zurück
		if ( WindowId < 0)
		{
			var tmpUP = user_position;
			var tmpDist = user_dist;
			startSituation();
			showAlert("specialcolor","Derzeit sind keine Fenster in deiner Richtung frei.");
			user_position = tmpUP
			user_dist = tmpDist;
		}
		else 
		{
			showAlert("darkcolor","Das Fenster welches in deine Richtung zeigt ist besetzt. Du hast eins daneben bekommen.");
		}
		// -1 wenn keins gefunden werden kann
	})  

	io.on('timeout', function(data) {
		showAlert("specialcolor","Du warst jetzt länger inaktiv. Lade die Seite erneut.");
		app_error = true;
		//Set all Elements faded out! execept the splash!
		$("div[class*='col']:not(.splash)").css("opacity",0.2);
		prohibit_btn_step1();
		prohibit_btn_step2();
		//todo: timeout nutzer war zu lange inaktiv, fenster wird freigegeben
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

function ioSendGesture (inGestureType,inVelocity) {
	console.log("we have a gesture:"+inGestureType+" velocity:"+inVelocity);
	io.emit('processGesture',{"name":inGestureType});
}

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
			//compute Velocity
			var tmpVelo = event.velocity/8.0;
			tmpVelo = Math.abs(tmpVelo); 
			if(tmpVelo > 1.0)
				tmpVelo = 1.0;
					
			// send Gesture Events to SocketIO		
			if( event.deltaX > 0)
				ioSendGesture(GESTURETYPES.SWIPE_RIGHT,tmpVelo);
			else
				ioSendGesture(GESTURETYPES.SWIPE_LEFT,tmpVelo);
		}
	});
	// DRAG UP / DOWN GESTURE!
	mc.on("panup pandown", function(event) {
		if( splash3_hint == 0)
			setSplash3To(1);
		//continous Color fading between prefered_color and Black ( 1.0 ) and White ( 0.0 )
		color_percent += parseFloat(event.deltaY)/8000.0;  
		var tmpColor = computeColor();
		//send new WindowColors to Socket
		ioSendCurrentWindowColor(tmpColor);
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
		ioSendGesture(GESTURETYPES.DOUBLETAP);
		ioSendCurrentWindowColor(prefered_user_color);
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
	//STEP 2
	var prefered_user_color = null;
	prohibit_btn_step2
	hideAlert(2);
	//STEP 3
	splash3_hint = 0;
	setSplash3To(0);
	color_percent = 0.5;

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

	if( prefered_user_window == null)
	{
		showAlert("specialcolor","Markiere deinen Standort auf der Karte oder klicke den GPS-Button.");
		return;
	}
	current_step = 2;
	ioSendFinalWindowNumber(prefered_user_window);
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
}

function selectColor(e,inColor){
	if( app_error )
		return;

	// compute the HexValue
	var rgbArray = getRGB(inColor)
	var hexValue = rgbToHex(rgbArray[0],rgbArray[1],rgbArray[2])

	// Show the Splash
	showAlert("darkcolor","Gute Wahl.");
	$( "#splash2" ).css({background: inColor});

	// Set the Color als prefered
	prefered_user_color = hexValue;

	//Send Current prefered Color to Socket
	ioSendCurrentWindowColor(prefered_user_color);
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

	var angle = Math.atan2((onPicX-320),(onPicY-320));
	angle = angle*180/Math.PI;
	angle+=90;

	prefered_user_window = computeWindowFromAngle(parseFloat(angle));
	allow_btn_step1();
	showAlert("darkcolor"," Ah ja, da drüben! Ich kann dich sehen.");
	ioSendCurrentWindowNumber(prefered_user_window);
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
	//set everything back
	prohibit_btn_step1();
	prefered_user_window = null;
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

  if ( prefered_user_window != null )
  	allow_btn_step1();
}
function geoError() {
	showAlert("darkcolor","Deine Position konnte nicht ermittelt werden.");
}
function setDistanceSplash()
{
	if( user_dist > TOO_FAR_AWAY)
		showAlert("darkcolor","Komm näher! Du bist "+parseFloat(user_dist).toFixed(1)+"km weit vom Turm entfernt.");
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
	console.log("newState: "+newState+ " splash3_hint:"+splash3_hint+" - "+current_step);
	if(splash3_hint == newState)
		return;

	if( newState >= 0 && newState<3) // 0,1,2,
	   showAlert("darkcolor",SPLASH3_TEXT[newState]);
	else
		hideAlert();

	splash3_hint = newState;
}
