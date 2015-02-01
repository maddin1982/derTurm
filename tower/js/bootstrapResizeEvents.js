
$(document).ready(function () {
	var bootstrapMode="";
	var maxiMode = true;

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

				setSizeClass("lg");
				setMaxiMode();
				
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","6.2%")
				
			}
			if(currMode=="md"){
				console.log("mode md")

				setSizeClass("md");
				setMaxiMode();
				
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","6.2%")
				
			}
			if(currMode=="sm"){
				console.log("mode sm")
				
				setSizeClass("sm");
				setMaxiMode();
				
				//change width of windows in framedisplay 
				//$(".windowContainer div").css("width","5%")

			}
			if(currMode=="xs"){
				console.log("mode xs");
				
				setSizeClass("xs");
				setMiniMode();

			}
			bootstrapMode=currMode;
		}	
	}

	function setSizeClass(size) {
		$("body").removeClass("mode-lg");
		$("body").removeClass("mode-md");
		$("body").removeClass("mode-sm");
		$("body").removeClass("mode-xs");
		$("body").addClass(size);
	}

	function setMiniMode() {
		if(maxiMode) {
			maxiMode = false;
			$("#scalablePreviewWindow canvas").hide();
			$("#editModeBtn").hide();
			$("#viewModeBtn").hide();
			$("#readyEditingBtns").show();
			stop3dModel();
		}
	}

	function setMaxiMode() {
		if(!maxiMode) {
			maxiMode = true;
			$("#scalablePreviewWindow canvas").show();
			$("#editModeBtn").show();
			$("#viewModeBtn").show();
			$("#readyEditingBtns").hide();
			reload3dModel();
		}
	}
	
	doSthOnModeChange();
})


