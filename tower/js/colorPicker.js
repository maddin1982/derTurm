var colorPickerObj=function(colorPickerDiv){
	this.colorPickerDiv=colorPickerDiv;
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
	

	this.addColorSelection=function(){
		var colorselectionDiv=colorGenerator.getFullColorSelection(20,that.colorPickerDiv.width(),that.colorPickerDiv.height(),3)
		$(colorselectionDiv).find(".singleColor").on("mouseup",function(evt){
			if(!that.isDragged){
				var newColor=$(evt.target).css("backgroundColor");
				framesManager.currentWindowBrushColor=colorGenerator.parseColor(newColor);
				$(framesManager.lastSelectedWindowDiv).css("backgroundColor",newColor)
				//framesManager.setSingleWindowColor(newColor);
				that.hide();
			}
		})
		that.colorPickerDiv.append(colorselectionDiv);		
	}
}