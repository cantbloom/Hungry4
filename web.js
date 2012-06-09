var express = require('express'),
request = require('request'),
async = require('async');

var app = express.createServer(express.logger());
//http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=pasta
app.get('/', function(request, response) {
  
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

function getGoogleCount(query, callback){
	console.log('a')
	request('http://www.bing.com/search?q='+query, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var myRegexp = /id\="count">(.*)? results/;
		var match = myRegexp.exec(body);
	  	console.log(parseInt(match[1].replace(/,/g,'')));
	    console.log(query)
	    //callback(null, count);
	    return 
	  }
	  //callback('error wit google search '+ query);
	  console.log(query)
	  return
	})
}

function getRatios(query, callback){
	async.map([query, query + ' spicy', query + ' sweet', query + ' ethnic'], getGoogleCount, function(err, results){
    	console.log(results, err)
	});
}


var x = 0;
for (i=0; i<210; i++){
	getGoogleCount(i);
}
//getRatios('samosa',null);
