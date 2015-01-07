function colorGeneratorObj(){
	var that=this;

	this.ColorSets={
		FULL:["#ff0000","#ff8800","#ffff00","#88ff00","#00ff00","#00ffff","#0088ff","#0000ff","#8800ff","#ff00ff","#ff0088","#888888"],
		WARM:["#ff0000","#ff4400","#ff8800","#ffbb00","#ffff00","#aaff00","#88ff00","#44ff00","#00ff00"],
		COLD:["#00ffff","#00bbff","#0088ff","#0044ff","#0000ff","#4400ff","#8800ff","#bb00ff","#ff00ff","#ff00bb","#ff0088"]
	}
	

	//hard coded color lists
	this.standardColorBars=[
		{name:"red",position:1,colors:["#330000","#660000","#990000","#CC0000","#FF0000","#FF3333","#FF6666","#FF9999","#FFCCCC"]},
		{name:"orange",position:2,colors:["#331900","#663300","#994C00","#CC6600","#FF8000","#FF9933","#FFB266","#FFCC99","#FFE5CC"]},
		{name:"yellow",position:3,colors:["#333300","#666600","#999900","#CCCC00","#FFFF00","#FFFF33","#FFFF66","#FFFF99","#FFFFCC"]},
		{name:"lightGreen",position:4,colors:["#193300","#336600","#4C9900","#66CC00","#80FF00","#99FF33","#B2FF66","#CCFF99","#E5FFCC"]},
		{name:"green",position:5,colors:["#003300","#006600","#009900","#00CC00","#00FF00","#33FF33","#66FF66","#99FF99","#CCFFCC"]},
		{name:"seaGreen",position:6,colors:["#003319","#006633","#00994C","#00CC66","#00FF80","#33FF99","#66FFB2","#99FFCC","#CCFFE5"]},
		{name:"cyan",position:7,colors:["#003333","#006666","#009999","#00CCCC","#00FFFF","#33FFFF","#66FFFF","#99FFFF","#CCFFFF"]},
		{name:"blue",position:8,colors:["#001933","#003366","#004C99","#0066CC","#0080FF","#3399FF","#66B2FF","#99CCFF","#CCE5FF"]},
		{name:"darkBlue",position:9,colors:["#000033","#000066","#000099","#0000CC","#0000FF","#3333FF","#6666FF","#9999FF","#CCCCFF"]},
		{name:"violet",position:10,colors:["#190033","#330066","#4C0099","#6600CC","#7F00FF","#9933FF","#B266FF","#CC99FF","#E5CCFF"]},
		{name:"magenta",position:11,colors:["#330033","#660066","#990099","#CC00CC","#FF00FF","#FF33FF","#FF66FF","#FF99FF","#FFCCFF"]},
		{name:"pink",position:12,colors:["#330019","#660033","#99004C","#CC0066","#FF007F","#100000","#FF3399","#FF99CC","#FFCCE5"]},
		{name:"grey",position:13,colors:["#000000","#202020","#404040","#606060","#A0A0A0","#C0C0C0","#9E9E9E","#E0E0E0","#FFFFFF"]}
	];

	//helper function to interpolate colors
	var _interpolateColor=function(minColor,maxColor,maxDepth,depth){
		function d2h(d) {return d.toString(16);}
		function h2d(h) {return parseInt(h,16);}
	   
		if(depth == 0){
			return minColor;
		}
		if(depth == maxDepth){
			return maxColor;
		}
	   
		var color = "#";
	   
		for(var i=1; i <= 6; i+=2){
			var minVal = new Number(h2d(minColor.substr(i,2)));
			var maxVal = new Number(h2d(maxColor.substr(i,2)));
			var nVal = minVal + (maxVal-minVal) * (depth/maxDepth);
			var val = d2h(Math.floor(nVal));
			while(val.length < 2){
				val = "0"+val;
			}
			color += val;
		}
		return color;
	};
	
	//create div with color fade from black to color to white with given number of steps
	this.createColorBarDiv=function(color,numberOfSteps,width,height){	
		//defaults
		if(!width)width=20;
		if(!height)height=20;
		if(!numberOfSteps)numberOfSteps=10;
		
		var colorBarDiv=document.createElement('div');
		var firstPart=Math.floor(numberOfSteps/2);
		var secondPart=numberOfSteps-firstPart;
		//from black to full Color
		for(var i =0;i<firstPart;i++){
			$(colorBarDiv).append("<div class='singleColor' style='height:"+height+"px;width:"+width+"px;float:left;background:"+_interpolateColor("#000000",color,firstPart,i)+"'></div>");
		}
		//from full Color to white
		for(var i =1;i<secondPart+1;i++){
			$(colorBarDiv).append("<div class='singleColor' style='height:"+height+"px;width:"+width+"px;float:left;background:"+_interpolateColor(color,"#ffffff",secondPart,i)+"'></div>");
		}
		$(colorBarDiv).append("<div style='clear:both'></div>");
		return colorBarDiv;
	}
	
	//create div with multiple colorBars
	this.getFullColorSelection=function(numberOfSteps,width,height,colorSet){
		if(!colorSet)
			colorSet=that.ColorSets.FULL;

		var singleColorWidth=width/numberOfSteps;
		var singleColorHeight=height/colorSet.length;

		var colorSelection=document.createElement('div');
		
		$.each(colorSet,function(i,color){
			$(colorSelection).append(that.createColorBarDiv(color,numberOfSteps,singleColorWidth,singleColorHeight))
		})	
		$(colorSelection).css("class","colorSelector")
		return colorSelection;
	}
	
	this.parseColor = function(color) {	 
		var cache
		, p = parseInt // Use p as a byte saving reference to parseInt
		, color = color.replace(/\s\s*/g,'') // Remove all spaces
		;//var
		// Checks for 6 digit hex and converts string to integer
		if (cache = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color))
		cache = [p(cache[1], 16), p(cache[2], 16), p(cache[3], 16)];
		// Checks for 3 digit hex and converts string to integer
		else if (cache = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color))
		cache = [p(cache[1], 16) * 17, p(cache[2], 16) * 17, p(cache[3], 16) * 17];
		// Checks for rgba and converts string to
		// integer/float using unary + operator to save bytes
		else if (cache = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color))
		cache = [+cache[1], +cache[2], +cache[3], +cache[4]];
		// Checks for rgb and converts string to
		// integer/float using unary + operator to save bytes
		else if (cache = /^rgb\(([\d]+),([\d]+),([\d]+)\)/.exec(color))
		cache = [+cache[1], +cache[2], +cache[3]];
		// Otherwise throw an exception to make debugging easier
		else throw Error(color + ' is not supported by $.parseColor');
		// Performs RGBA conversion by default
		isNaN(cache[3]) && (cache[3] = 1);
		// Adds or removes 4th value based on rgba support
		// Support is flipped twice to prevent erros if
		// it's not defined
		return cache.slice(0,3 + !!$.support.rgba);
	}
}
var colorGenerator= new colorGeneratorObj();