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
	$voteContainer = $('#vote-container');
	$currentPhoto = $('#current-photo');
	$preload = $('#preload');
	$photoCaption = $('#photo-caption');
	$upVote = $('#vote-up');
	$downVote = $('#vote-down');
	$map = $('#map');
	$want = $('#want');
	$bg = $('#bg').fadeOut(0);
	

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
		$locContainer.fadeOut();
		locationResponse($locInput.val(), function(results){
			foodResponse(results);
			loadNext();
		});
	})

	$upVote.click(function(){
		if (!$voteContainer.hasClass('disabled')){
			CURRENT_ITEM.vote = 1 // 1 for up
			NUM_POS_VOTES += 1;
			updateUserVector(CURRENT_ITEM.ratio)
			$voteContainer.addClass('disabled')
			loadNext();
		}
	})

	$downVote.click(function(){
		if (!$voteContainer.hasClass('disabled')){
			CURRENT_ITEM.vote = 0 // 0 for down
			$voteContainer.addClass('disabled')
			loadNext();
		}
	})

	$bg.load(function(){
		$bg.fadeIn(500);
	})

	$preload.load(function(){
		$currentPhoto.fadeOut(50, function(){
			$currentPhoto.attr('src', CURRENT_ITEM.photo).fadeIn(50, function(){
				$voteContainer.removeClass('disabled')
			});
		})	
	})

	$want.click(function(){
		//loadItem(CURRENT_ITEM);
	})
	var src = "../static/images/bg" + Math.floor((Math.random()*10)+1) + ".jpg";
	$bg.attr('src', src);

	//tips!
	$useCurrentButton.qtip({
		content: 'Use your current location.',
		position: {corner: {target: 'bottomMiddle',tooltip: 'topMiddle'}},
		style: {name: 'dark', tip: 'topMiddle'} //cream, dark, green, light, red, blue
 	});

 	$upVote.qtip({
		content: 'Yum! Show me more food like this.',
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'green',tip: 'bottomMiddle'} //cream, dark, green, light, red, blue
 	});

 	$downVote.qtip({
		content: 'Let\'s try something else, please.',
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'red',tip: 'bottomMiddle'} //cream, dark, green, light, red, blue
 	});

/* 	$want.qtip({
		content: makeWantTip(),
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'dark', tip: 'bottomMiddle',width: { max: 500}}, //cream, dark, green, light, red, blue
		solo: true,
		show: 'click',
   		hide: 'click',
   		api: {
			beforeShow: function(){
				

				//map
				var mapSrc = getMap(CURRENT_ITEM.lat, CURRENT_ITEM.lng, CURRENT_ITEM.title);

			}	 
	    }
 	});*/
	$want.qtip(
		{
			content: {
				title: {
					text: '<span id="modal-title">'+CURRENT_ITEM.title+'</span>',
					button: 'Close'
				},
				text: makeWantTip()
			},
			position: {
				target: $(document.body), // Position it via the document body...
				corner: 'center' // ...at the center of the viewport
			},
			show: {
				when: 'click', // Show it on click
				solo: true // And hide all other tooltips
			},
			hide: false,
			style: {
				width: { max: 500 },
				padding: '14px',
				border: {
					width: 9,
					radius: 9,
					color: '#666666'
				},
				name: 'light'
			},
			api: {
				beforeShow: function(){
				// Fade in the modal "blanket" using the defined show speed
				$('#overlay').fadeIn(this.options.show.effect.length);
				$('#modal-title').html(CURRENT_ITEM.title);
				//tumblr button
				var tumblr_photo_source = CURRENT_ITEM.photo,
				tumblr_photo_caption = CURRENT_ITEM.title +' from Hungry4',
				tumblr_photo_click_thru = 'http://Hungry4.herokuapp.com',
				href = "http://www.tumblr.com/share/photo?source=" 
				+ encodeURIComponent(tumblr_photo_source) + "&caption=" 
				+ encodeURIComponent(tumblr_photo_caption) + "&click_thru=" 
				+ encodeURIComponent(tumblr_photo_click_thru);
				$('#tumblrButton').attr('href', href);

				//twitter
				var twitter_text = CURRENT_ITEM.title +' from Hungry4';
				$('#twitterButton').attr('data-url', CURRENT_ITEM.photo).attr('data-text', twitter_text);

				
				//gogole maps
				var src = getMap(CURRENT_ITEM.lat, CURRENT_ITEM.lng);
				$('#map_img').attr('src', src);
				var href = 'http://www.yelp.com/search?find_desc='+ CURRENT_ITEM.place
						+ '&find_loc=' + $(CURRENT_ITEM.address).text();
				$('#yelpButton').attr('href', href);
			},
			beforeHide: function(){
				// Fade out the modal "blanket" using the defined hide speed
				$('#overlay').fadeOut(this.options.hide.effect.length);
			}
		}
	});

 	$('#walk').qtip({
		content: 'Search ~5 blocks around you',
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'dark', tip: 'bottomMiddle'} //cream, dark, green, light, red, blue
 	});

 	$('#bike').qtip({
		content: 'Search 2 miles around you',
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'dark', tip: 'bottomMiddle'} //cream, dark, green, light, red, blue
 	});

 	$('#drive').qtip({
		content: 'Search 5 miles around you',
		position: {corner: {target: 'topMiddle',tooltip: 'bottomMiddle'}},
		style: {name: 'dark', tip: 'bottomMiddle'} //cream, dark, green, light, red, blue
 	});

})

function getGoogleCount(query, callback){
	callback(null, Math.random());
	return;

	if (getLocal(query)) {
		//console.log('local')
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
	flavors = ['spicy', 'meat', 'fish', 'ethnic', 'breakfast', 'lunch', 'dinner', 'hipster'].map(function(item){return query + ' ' + item});
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
	$preload.attr('src', item.photo);
	$photoCaption.html('The "'+item.dish+'"');
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
	//console.log(USER_VECTOR);
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

function makeWantTip(){
	html = ""
	html +='<div id="map" style="width:400px; height:400px"><img id="map_img"></div>'
	html += makeTumblrButton();
	html += makeYelpButton();
	//html +=makeTwitterButton();
	return html
}

function getMap(lat, lng) {
	var loc = lat + "," + lng;
	var url = "http://maps.googleapis.com/maps/api/staticmap?center=" 
	+ loc + "&zoom=14&size=400x400&markers=color:red%7Clabel:S%7C" 
	+ loc + "&sensor=true";
	return url;
  }

function makeYelpButton() {
	return '<a id="yelpButton" target="_blank" href="">' +
			'<img id = "yelpLogo" src = "/static/images/yelpLogo.png" >' +
			'</a>'
	}

function makeTumblrButton(){
	var tumblr_photo_source = CURRENT_ITEM.photo,
	tumblr_photo_caption = CURRENT_ITEM.title +' from Hungry4',
	tumblr_photo_click_thru = 'http://Hungry4.herokuapp.com',
	href = "http://www.tumblr.com/share/photo?source=" + encodeURIComponent(tumblr_photo_source) + "&caption=" + encodeURIComponent(tumblr_photo_caption) + "&click_thru=" + encodeURIComponent(tumblr_photo_click_thru),
	title = "Share on Tumblr",
	style = "display:inline-block; text-indent:-9999px; overflow:hidden; width:129px; height:20px; background:url('http://platform.tumblr.com/v1/share_3.png') top left no-repeat transparent;";

	//console.log(tumblr_photo_source);
	return '<a id="tumblrButton" target="_blank" href="'+href+'" title="'+title+'" style="'+style+'">Share on Tumblr</a>   '
}

function makeTwitterButton(){
	var text = CURRENT_ITEM.title +' from Hungry4';
	return '<a id="twitterButton" href="https://twitter.com/share" class="twitter-share-button" data-url="'+CURRENT_ITEM.photo+'" data-text="'+text+'" data-via="Hungry4App">Tweet</a>'
}