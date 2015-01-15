var colorPickerObj=function(colorPickerDiv, colorViewer){
	
	this.colorPickerDiv=colorPickerDiv;
	this.colorViewer=colorViewer;
	this.isDragged=false;
	var that=this;

	colorPickerDiv.draggable({
		start: function() {
			that.isDragged=true;
		},
		stop: function() {
			that.isDragged=false;		
		}			
	})
	
	this.show=function(){
		that.colorPickerDiv.show();
	}
	this.hide=function(){
		if(!that.isDragged)
			that.colorPickerDiv.hide();
		
	}
	this.moveToPosition=function(x,y){
		var width=that.colorPickerDiv.width()
		if(x>$( window ).width()/2)
			x= x-width-20;
		else
			x+=20;	
		
		if(y>$( window ).height()-that.colorPickerDiv.height())
			y= y-that.colorPickerDiv.height()-20;
		else
			x+=20;	
		
		that.colorPickerDiv.css("top",y)
		that.colorPickerDiv.css("left",x)
	}

	this.addColorSelection=function(colorSet){
		that.colorPickerDiv.empty();
		var horizontalColorSteps=16;
		var w=that.colorPickerDiv.width();
		var h=that.colorPickerDiv.height()-25;
		
		var colorselectionDiv=colorGenerator.getFullColorSelection(horizontalColorSteps,w,h,colorSet)
		$(colorselectionDiv).find(".singleColor").on("mouseup",function(evt){
			if(!that.isDragged){
				var newColor=$(evt.target).css("backgroundColor");
				$(evt.target).parent().parent().find(".lastSelectedColor").removeClass("lastSelectedColor");
				$(evt.target).addClass("lastSelectedColor");
				framesManager.currentWindowBrushColor=colorGenerator.parseColor(newColor);
				//$(framesManager.lastSelectedWindowDiv).css("backgroundColor",newColor)
				//framesManager.setSingleWindowColor(newColor);
				that.colorViewer.css("backgroundColor", newColor);
				that.hide();
			}
		})
		
		var selectColorSetDiv=document.createElement('div');
		for(var i in colorGenerator.ColorSets){
			var selectColorSetBtn=document.createElement('button')
			$(selectColorSetBtn).attr("class","colorSetSelectBtn")
			$(selectColorSetBtn).attr("ColorSetName",i);
			selectColorSetBtn.innerHTML=i;
			$(selectColorSetBtn).on("mouseup",function(e){
				ColorSetName=$(this).attr("ColorSetName");
				e.stopPropagation();
				that.addColorSelection(colorGenerator.ColorSets[ColorSetName])
			})
			$(selectColorSetDiv).append(selectColorSetBtn);

		}
		$(selectColorSetDiv).css("height","25px");
		that.colorPickerDiv.append(selectColorSetDiv);
		that.colorPickerDiv.append(colorselectionDiv);		
	}
	
}