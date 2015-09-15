var PORT = 33333;
var HOST = '37.187.39.90';

var dgram = require('dgram');
//var message = new Buffer('[kazoosh]||100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255|100,200,255');

function getRandMessage(){
	var returnval='[kazoosh]||'
	for(var i=0;i<15;i++){
		returnval+=''+Math.random()*255+','+Math.random()*255+','+Math.random()*255+'|';
	}
	returnval+=''+Math.random()*255+','+Math.random()*255+','+Math.random()*255;
	return returnval;
}

var client = dgram.createSocket('udp4');

var intervallcount=0;
var intervall= setInterval(function(){tick()}, 50);

function tick(){
	var message=new Buffer(getRandMessage());
	client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
		if (err) throw err;
		console.log('UDP message sent to ' + HOST +':'+ PORT);
		
	});
	
	intervallcount++;
	if(intervallcount>100){
		clearInterval(intervall);
		client.close();
	}
}




