
$(document).ready(function () {
	var bootstrapMode="";

	function checkMode(){
		if ($(window).width() < 768) {
			return 'xs';
		}
		else if ($(window).width() > 768 &&  $(window).width() <= 992) {
			return 'sm';
		}
		else if ($(window).width() > 992 &&  $(window).width() <= 1200) {
			return 'md';	
		}
		else  {
			return "lg";
		}
	}

	$(window).on('resize', function () {
		doSthOnModeChange();
	});

	function doSthOnModeChange(){
		//check if mode differs
		currMode=checkMode();
		if(bootstrapMode!=currMode){
			
			if(currMode=="lg"){
				console.log("mode lg")
				
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","6.2%")
				
			}
			if(currMode=="md"){
				console.log("mode md")
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","6.2%")
				
			}
			if(currMode=="sm"){
				console.log("mode sm")
				
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","5%")
			}
			if(currMode=="xs"){
				console.log("mode xs")
			}
			bootstrapMode=currMode;
		}	
	}
	
	doSthOnModeChange();
})


