$(function  () {
  $("ol.composition").sortable({
	  group: 'nested',
	    afterMove: function (placeholder, container) {
	    },
	    onDrop: function (item, container, _super) {
	    	alert("yes")
	      _super(item)
	    },

	  onDragStart: function (item, container, _super) {
	    // Duplicate items of the no drop area
	    if(!container.options.drop)
	      item.clone().insertAfter(item)
	    _super(item)
	  }
   })


	$("ol.savedScenes").sortable({
	  group: 'nested',
	  drop: false
	  //drag: false
	})

	$("ol.sceneHelpers").sortable({
	  group: 'nested',
	  drop: false
	})
})




