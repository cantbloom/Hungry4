var express = require('express'),
fs = require('fs'),
request = require('request'),
async = require('async'),
path = require('path');
querystring = require('querystring');
url = require('url');



var WEBROOT = path.join(path.dirname(__filename), '/webroot');
SF_CACHE = null; // cache of foot spotting results in SF

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
	//console.log(query);
	var addr = query['addr'],
	lat = query['lat'],
	lng = query['lng'],
	page_start = query['page_start'],
	page_end = query['page_end'],
	radius = query['radius'];
	//console.log(addr, lat, lng, pages, radius);
	foodMe(addr, lat, lng, page_start, page_end, radius, function(results) {
		response.writeHead(200, {
			'Content-Type': 'application/json'
		});
		//console.log(JSON.stringify(results));
		response.write(JSON.stringify(results));
		response.end();
	});
});

app.get('/addrFrmlatLng', function(request, response) {
	var query = url.parse(request.url, true).query;
	//console.log(query);
	lat = query['lat'],
	lng = query['lng'],
	addrFrmlatLng(lat, lng,  function(results) {
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		//console.log(results);
		response.write(results);
		response.end();
	});
});

app.get('/want', function(request, response) {
	var query = url.parse(request.url, true).query;
	//console.log(query);
	lat = query['lat'],
	lng = query['lng'],
	addrFrmlatLng(lat, lng,  function(results) {
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		//console.log(results);
		response.write(results);
		response.end();
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});

function latLngFrmAddr(addr, callback) {
	var APIurl = "http://maps.googleapis.com/maps/api/geocode/json?address="; 
	var URL = APIurl + encodeURIComponent(addr) + "&sensor=true";
	//console.log(URL);
	request({url: URL }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var json = JSON.parse(response.body);
			//console.log(json);
			if(json['status'] != 'OVER_QUERY_LIMIT' ) {
				loc = json["results"][0]["geometry"]["location"]; 
				latLng = [ loc["lat"], loc["lng"] ];
			}
			else {
				latLng = [37.7749295,-122.4194155]; // default to SF
			}
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
			var json = JSON.parse(response.body);
			//console.log(json);
			var addr;
			if(json['status'] != 'OVER_QUERY_LIMIT' ) {
				addr = json["results"][0]["formatted_address"];
				addr = addr.split(",")[0] + "," +  addr.split(",")[1]; // format street & city
			}
			else {
				addr = "San Francisco";
			}

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

function foodMe(addr, lat, lng, page_start, page_end, radius, callback) {
	var addr = addr || 'San Francisco';
	if(addr == 'San Francisco' && SF_CACHE != null) {
		callback(SF_CACHE);
		return
	}

	var page_start = page_start || 1,
	page_end = page_end || 2,
	lat = lat || null,
	lng = lng || null;
	if (lat == null && lng == null) {
		latLngFrmAddr(addr, function(latLng) {
			loc = latLng 
			if (latLng != []) {
				lat = loc[0];
				lng = loc[1];
				var box = boundingBox(lat, lng, radius),
				sw = String(box['sw']),
				ne = String(box['ne']);
				addr = null;
			}
			sw = sw || null;
			ne = ne || null;
			var payload_arr = [];
			for(var i = 0; i < page_end; i ++ ) {
				payload_arr[i] = {
					'authenticity_token' : '',
					'ajax' : 1,
					'page': i + page_start,
					'addr' : addr,
					'sw' : sw,
					'ne' : ne,
				}; 
			}
			
			async.map(payload_arr, getFoodSpot, function(error, results) {
				sightings = []
				for (var item in results) {
					if (results[item] != undefined){
						sightings = sightings.concat(results[item]);
					}
				}
				callback(sightings);
			});
			
		});
	}
}

function getFoodSpot(payload, callback) {
	var regex = /Sightings \= (\[\{.*\}\])/;
	//console.log("http://www.foodspotting.com/explore?" + querystring.stringify(payload));
	var req = request.get({url: "http://www.foodspotting.com/api/v1/sightings.json?api_key=88jrlU7j4HsTnnVNciqhfZbXd6vgPmVU9gbu46Mh&" + querystring.stringify(payload) }, function (error, response, body) {
		if (!error && response.statusCode == 200) {
  			sightings = JSON.parse(body).data.sightings
  			if (sightings != null ) {
  				for (var item in sightings) {
  					sightings[item].photo = sightings[item].current_review.thumb_590;
  					sightings[item].dish = sightings[item].item.name;
  					sightings[item].place = sightings[item].place.name;
  					sightings[item].lat = sightings[item].place.latitude;
  					sightings[item].lng = sightings[item].place.longitude;
  					sightings[item].address = sightings[item].place.street_address + "," + sightings[item].place.city + "," + sightings[item].place.state;
  				}

  			}
  			else {
  				console.log("no sightings :(");
  			}
  			callback(null, sightings);
  			}
  		});
	}


foodMe("Cambridge, MA", null, null, 1, 5, 1, function(results){
	SF_CACHE = results;
});
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