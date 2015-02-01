 $(function() {
    $('#datetimepicker1').datetimepicker({
      language: 'pt-BR'
    });
  });



function convertTimestamp(unix_timestamp){
	// create a new javascript Date object based on the timestamp
	// multiplied by 1000 so that the argument is in milliseconds, not seconds
	var date = new Date(unix_timestamp);
	// hours part from the timestamp
	var hours = date.getHours();
	// minutes part from the timestamp
	var minutes = "0" + date.getMinutes();
	// seconds part from the timestamp
	var seconds = "0" + date.getSeconds();

	var date = date.getDate() + "."+ (date.getMonth()+1) + "."+ date.getFullYear()
	// will display time in 10:30:23 format
	var formattedTime = date + "-" + hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
	return formattedTime
}