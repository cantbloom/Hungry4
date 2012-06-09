var express = require('express'),
request = require('request'),
async = require('async');

var app = express.createServer(express.logger());
//http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=pasta
app.get('/', function(request, response) {
  var x = 0;
	for (i=0; i<10000; i++){
		getGoogleCount(i);
	}
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

function getGoogleCount(query, callback){
	request('http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q='+query, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    console.log(query)
	    var json = JSON.parse(response.body),
	    count = json.responseData.cursor.estimatedResultCount;
	    
	    //callback(null, count);
	    return 
	  }
	  //callback('error wit google search '+ query);
	  return
	})
}

function getRatios(query, callback){
	async.map([query, query + ' spicy', query + ' sweet', query + ' ethnic'], getGoogleCount, function(err, results){
    	console.log(results, err)
	});
}



//getRatios('samosa',null);