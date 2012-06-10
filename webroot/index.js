$(function(){
	console('a')
	$.get('http://ajax.googleapis.com/ajax/services/search/web?_=1339237710608&v=1.0&q='+query, function (res) {
	  if (!error && response.statusCode == 200) {
	  	console.log(res)
	  	var json = JSON.parse(res),
	    count = json.responseData.cursor.estimatedResultCount;
	    console.log(query)
	    console.log(count)
	    //callback(null, count);
	    return 
	  }
	  //callback('error wit google search '+ query);
	  console.log(query)
	  return
	})
})