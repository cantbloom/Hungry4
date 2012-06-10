var express = require('express'),
fs = require('fs'),
request = require('request'),
async = require('async'),
path = require('path');
querystring = require('querystring');
url = require('url');

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

app.get('/foodMe', function(request, response) {
	var query = url.parse(request.url, true).query;
	console.log(query);
	var addr = query['addr'],
	lat = query['lat'],
	lng = query['lng'],
	pages = query['pages'],
	radius = query['radius'];
	console.log(addr, lat, lng, pages, radius);
	foodMe(addr, lat, lng, pages, radius, function(results) {
		response.writeHead(200, {
			'Content-Type': 'application/json'
		});
		//console.log(JSON.stringify(results));
		response.write(JSON.stringify(results));
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


// address to lat/long

function latLngFrmAddr(addr, callback) {
	var APIurl = "http://maps.googleapis.com/maps/api/geocode/json?address="; 
	var URL = APIurl + encodeURIComponent(addr) + "&sensor=true";
	//console.log(URL);
	request({url: URL }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(response.body),
			loc = json["results"][0]["geometry"]["location"]; 
			latLng = [ loc["lat"], loc["lng"] ];
			callback(latLng);
			return
		}
		callback(error);
		return
	});
}

// lat/long to addr

function addrFrmlatLng(lat, lng, callback) {
	var APIurl = "http://maps.googleapis.com/maps/api/geocode/json?latlng="; 
	var URL = APIurl + encodeURIComponent(lat + "," + lng) + "&sensor=true";
	//console.log(URL);
	request({url: URL }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(response.body),
			addr = json["results"][0]["formatted_address"]; 
			callback(addr);
			return
		}
		callback(error);
		return
	});
}

// bounding box
function boundingBox(lat, lng, rad) {
	var rad_km = rad* 1.609344/10, // rad given in tenths of a mile (block)
	delta = rad_km*90/10001.965729,
	box = [];
	box["ne"] = [lat + delta, lng + delta];
	box["sw"] = [lat - delta, lng - delta];
	return box
}

function foodMe(addr, lat, lng, pages, radius, callback) {
	var addr = addr || null,
	pages = pages || 1,
	lat = lat || null,
	lng = lng || null;

	if (lat == null && lng == null) {
		latLngFrmAddr(addr, function(latLng) {
			loc = latLng 
			lat = loc[0];
			lng = loc[1];
			var box = boundingBox(lat, lng, radius),
			result = ""
			payload_arr = [];
			for(var i = 0; i < pages; i ++ ) {
				payload_arr[i] = {
					'authenticity_token' : '',
					'ajax' : 1,
					'page': i +1,
					'sw' : String(box['sw']),
					'ne' : String(box['ne']),
				}; 
			}
			async.map(payload_arr, getFoodSpot, function(error, results) {
				sightings = []
				for (var item in results) {
					sightings.push(results[item]);
				}
				callback(sightings);
			});
			
		});
	}
}

function getFoodSpot(payload, callback) {
	var regex = /Sightings \= (\[\{.*\}\])/;
	//console.log("http://www.foodspotting.com/explore?" + querystring.stringify(payload));
	var req = request.get({url: "http://www.foodspotting.com/explore?" + querystring.stringify(payload) }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
  			var sightings = body.match(regex);
  			if (sightings != null ) {
  				sightings = sightings[1]
  				var json = JSON.parse(sightings);
  				for (var item in json) {
  					json[item].photo = json[item].photo.replace('thumb_90', 'thumb_600');
  					//console.log(json[item]);
  				}

  			}
  			else {
  				console.log("no sightings :(");
  			}
  			callback(null, json);
  		}
  	});
}

// latLngFrmAddr("641 ofarrel st san francisoc, ca", function(latLng) {
// 	console.log("latlng " + latLng);
// });
// addrFrmlatLng(37.7854214, -122.4155574, function(addr) {
// 	console.log("addr " + addr);
// });

//console.log(boundingBox(37.7854214,-122.4155574, .1))
// foodMe("641 ofarrell st san francisoc, ca", null, null, 2, 1, function(results){
// 	console.log(JSON.stringify(results));
// });
//console.log(foodMe("11374", 1, .1))
//console.log(foodMe(40.72702032493787, -73.86104117506211, 1, .1))