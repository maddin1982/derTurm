$(function  () {
  $("ol.composition").sortable({
  group: 'nested',
    afterMove: function (placeholder, container) {

    },
    onDrop: function (item, container, _super) {
      _super(item)
    }


    })
})
