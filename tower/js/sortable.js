enableNestedSortableInSceneView();
  
    //add drag and drop functions 
    function makeFramesContainersortable(){
ćonsole.log("enableNestedSortable")
  var oldContainer
  $("ol.nested_with_switch").sortable({
    group: 'nested'
  })

}