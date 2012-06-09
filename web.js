var express = require('express'),
fs = require('fs'),
request = require('request'),
async = require('async'),
path = require('path');

var WEBROOT = path.join(path.dirname(__filename), '/webroot');


var app = express.createServer(express.logger());

app.use('/static',express.static(WEBROOT));
app.use(express.bodyParser());


app.get('/', function(request, response) {
	fs.readFile(WEBROOT+'/index.html', function (err, data) {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        response.write(data);
        response.end();
    });  
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

function getGoogleCount(query, callback){
	console.log('a')
	var jar = request.jar(),
	cookie1 = request.cookie('GDSESS=ID=2ad3ab95806754c7:TM=1339232716:C=c:IP=98.234.85.34-:S=ADSvE-dVGVOssyow8i_I3Vm_32cnA0-RMQ');
	cookie2 = request.cookie('NID=60=jiNAHi1dtuNVKFNcN-Yu2h8ueLyyiqMlQMDycMzYlxxi0H9A9T7VPpIbuA5fTidmiqX1uqA2Ascoy_ufV-zY6U4hvuH0QIgwMPdoQyQuxpb9BTnxbmi_yPo_vuPyOBUG')
	jar.add(cookie1);
	jar.add(cookie2);
	request({url:'http://ajax.googleapis.com/ajax/services/search/web?_=1339237710608&v=1.0&q='+query, jar:jar}, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		//var myRegexp = /id\="count">(.*)? results/;
		//var match = myRegexp.exec(body);
	  	//console.log(parseInt(match[1].replace(/,/g,'')));
	  	var json = JSON.parse(response.body),
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
}

function getRatios(query, callback){
	async.map([query, query + ' spicy', query + ' sweet', query + ' ethnic'], getGoogleCount, function(err, results){
    	console.log(results, err)
    	//todo calc ratios
	});
}

