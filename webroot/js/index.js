$(function(){
	//GLOBALS
	RADIUS = .2;
	FOOD = [];
	USER_VECTOR = [.5,.5,.5,.5,.5,.5,.5];
	NUM_POS_VOTES = 0;
	CURRENT_ITEM = {};
	UNVIEWED_COUNT = 0;
	CURRENT_PAGE = 1;
	$photoContainer = $('#photo-container').fadeOut(0);
	$locContainer = $('#location-container');
	$locInput = $('#location');
	$searchButton = $('#search');
	$radiusOptions = $('.radius-option');
	$useCurrentButton = $('#useCurrentLocation');
	$currentPhoto = $('#current-photo');
	$photoCaption = $('#photo-caption');
	$upVote = $('#vote-up');
	$downVote = $('#vote-down');
	$choose = $('#choose');
	$bg = $('#bg');
	

	$radiusOptions.click(function(){
		$this = $(this);
		$('.radius-option.selected').removeClass('selected');
		$this.addClass('selected');
		
	})

	$useCurrentButton.click(function(){
		getLocation(function(latLong){
			$locInput.val(latLong);
		});
	})

	$searchButton.click(function(){
		locationResponse($locInput.val(), function(results){
			foodResponse(results);
			loadNext();
		});
	})

	$upVote.click(function(){
		CURRENT_ITEM.vote = 1 // 1 for up
		NUM_POS_VOTES += 1;
		updateUserVector(CURRENT_ITEM.ratio)
		loadNext();
	})

	$downVote.click(function(){
		CURRENT_ITEM.vote = 0 // 0 for down
		loadNext();
	})

	$choose.click(function(){
		//loadItem(CURRENT_ITEM);
	})
	var src = "../static/images/bg" + Math.floor((Math.random()*10)+1) + ".jpg";
	$bg.attr('src', src);
})

function getGoogleCount(query, callback){
	callback(null, Math.random());
	return;

	if (getLocal(query)) {
		console.log('local')
		callback(null, getLocal(query));
		return;
	}

	$.ajax({
	   type: 'GET',
		url: 'http://ajax.googleapis.com/ajax/services/search/web?_=1339237710608&v=1.0&q='+query,
		async: true,
		contentType: "application/json",
		dataType: 'jsonp',
		success: function(res, status, xhr){
		    try {
		    	count = res.responseData.cursor.estimatedResultCount;
			    //console.log(query)
			    //console.log(count)
			    setLocal(query, count)
			    callback(null, count);	
		    } catch (e){
		    	callback(e, null);	
		    }
		    
		}
	}); 
}

function getRatio(item, callback){
	var query = item.dish,
	flavors = ['spicy', 'meat', 'fish', 'ethnic', 'breakfast', 'lunch', 'dinner'].map(function(item){return query + ' ' + item});
	flavors.unshift(query) 

	async.map(flavors, getGoogleCount, function(err, results){
    	if (err != null){
    		return
    	}
    	var total = results.shift();
    	results = results.map(function(item){
    		return item/total;
    	})
    	item.ratio = results;
    	if (callback){
    		callback(null,item)
    	}
	});
}

function getFood(payload, callback){
	payload.page_start = CURRENT_PAGE,
	CURRENT_PAGE += 1;
	payload.page_end = CURRENT_PAGE;

	payload.radius = $('.radius-option.selected').attr('value');

	$.get('/foodMe', payload, function(res){
		UNVIEWED_COUNT += res.length
		async.map(res, getRatio, function(err,results){
			console.log('count done')
			callback(results);
		})
	})
}

function foodResponse(results){
	FOOD = FOOD.concat(results);
	console.log(UNVIEWED_COUNT);
}

function getLocation(callback){
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition( 
			function (position) {  
				var payload = {};
				payload.lat = position.coords.latitude;
				payload.lng = position.coords.longitude;
				$.get('/addrFrmlatLng', payload, function(res){
						callback(res);
				})
			}, 
			// next function is the error callback
			function (error){
				callback(null);
			}
		);
	}
}

function locationResponse(loc, callback){
	var payload = {};

	if (typeof loc == 'string'){
		payload.addr = loc;
	} else if ($.isArray(loc)){
		payload.lat = loc[0];
		payload.lng = loc[1];
	}
	getFood(payload, callback);
}

function transitionToImages(){
	$locContainer.fadeOut();
	$bg.fadeOut();
	$photoContainer.fadeIn();
}

function loadNext(){
	var item = nextImage(USER_VECTOR);
	
	item.viewed = true;
	UNVIEWED_COUNT -= 1;



	swapPhoto(item);

	if ($photoContainer.css('display') == 'none'){
		transitionToImages();
	}

	//get more images
	if (UNVIEWED_COUNT<=10){
		locationResponse($locInput.val(), function(results){
			foodResponse(results);
		});
	}	
}

function swapPhoto(item){
	CURRENT_ITEM = item;
	$currentPhoto.attr('src', item.photo);
	$photoCaption.html('The "'+item.dish+'"');
	$currentPhoto.css('backgroundImage', 'url('+item.photo+')')
}

function dotProduct (v1, v2){
	var max = (v1.length > v2.length) ? v1.length : v2.length,
		i,
		sum = 0;
	for (i = 0; i < max; i++){
		sum += (v1[i]*v2[i]) ? v1[i]*v2[i] : 0 ;
	}
	
	return sum;
}

function magnitude (v){
	var value = dotProduct(v,v);
	return Math.sqrt(value);
}

function cos (v1, v2) {
	if (magnitude(v1) == 0 || magnitude(v2) ==0){
		return 0;
	}
	var value = dotProduct(v1,v2)/(magnitude(v1)*magnitude(v2));
	return value;
}


function updateUserVector(newVector){
	USER_VECTOR = USER_VECTOR.map(function(value, index){
		return value + 1/NUM_POS_VOTES*newVector[index] //mean of all past pos votes
	})
	console.log(USER_VECTOR);
}

function nextImage(vector){
	var max = null,
	max_item = null;
	for (item in FOOD) {
		var val = cos(FOOD[item].ratio, vector);
		if (val > max) {
			if (!FOOD[item].viewed) {
				max_item = FOOD[item];
				max = val;
			}
		}
	}

	return max_item; 
}

function setLocal (key, value){
	if(typeof(Storage)!=="undefined") {
		localStorage[key] = value;
		
		return true

	} else {
	  	return null
	}
}

function getLocal(key){
	if( typeof(Storage)!=="undefined" ) {
		if (localStorage[key]){
			return localStorage[key]
		}

		return null

	} else {
	  	return null
	}
}