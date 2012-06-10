$(function(){
	//GLOBALS
	RADIUS = .2;
	FOOD = [];
	USER_VECTOR = [.5,.5,.5,.5,.5,.5,.5];
	NUM_POS_VOTES = 0;
	CURRENT_ITEM = {};
	$photoContainer = $('#photo-container').fadeOut(0);
	$locContainer = $('#location-container');
	$locInput = $('#location');
	$searchButton = $('#search');
	$radiusOptions = $('.radius-option');
	$useCurrentButton = $('#useCurrentLocation');
	$currentPhoto = $('#current-photo');
	$upVote = $('#vote-up');
	$downVote = $('#vote-down');
	

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
		locationResponse($locInput.val());
	})

	$upVote.click(function(){
		CURRENT_ITEM.vote = 1 // 1 for up
		NUM_POS_VOTES += 1;
		updateUserVector(CURRENT_ITEM.ratio)
	})

	$downVote.click(function(){
		CURRENT_ITEM.vote = 0 // 0 for down
		updateUserVector()
	})


	//prompt user for locaion
	//




})

function getGoogleCount(query, callback){
	//todo: caching
	var inCache = true;
	if (inCache) {
		//getFromCache(query);
		callback(null, Math.random());
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
	var pages = 1; //number of pages to be returned
	payload.pages = pages;
	payload.radius = $('.radius-option.selected').attr('value');
	$.get('/foodMe', payload, function(res){
		console.log(res.length);
		async.map(res, getRatio, function(err,results){
			callback(results);
		})
	})
}

function foodResponse(results){
	FOOD = results
	loadNext()
}

function getLocation(callback){
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition( 
			function (position) {  
				callback([position.coords.latitude, position.coords.longitude]);
			}, 
			// next function is the error callback
			function (error){
				callback(null);
			}
		);
	}
}

function locationResponse(loc){
	var payload = {};

	if (typeof loc == 'string'){
		payload.addr = loc;
	} else if ($.isArray(loc)){
		payload.lat = loc[0];
		payload.lng = loc[1];
	}
	getFood(payload, foodResponse)
}

function transitionToImages(){
	$locContainer.fadeOut();
	$photoContainer.fadeIn();
}

function loadNext(){
	var item = nextImage(USER_VECTOR);
	item.viewed = true;
	swapPhoto(item.photo);

	if ($photoContainer.css('display') == 'none'){
		transitionToImages();
	}
		
}

function swapPhoto(item){
	CURRENT_ITEM = item;
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

function cs (v1, v2) {
	if (magnitude(v1) == 0 || magnitude(v2) ==0){
		return 0;
	}
	var value = dotProduct(v1,v2)/(magnitude(v1)*magnitude(v2));
	return value;
}

function updateUserVector(newVecotr){
	USER_VECTOR.map(function(value, index){
		return value + 1/NUM_POS_VOTES*newVector[index] //mean of all past pos votes
	})
}

function nextImage(){
	
}