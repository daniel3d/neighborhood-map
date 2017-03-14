// The app knockoutJs view
// -----------------------------------------------------------------------------
var NeighborhoodMapViewModel = function() {
	var
	self = this,
	$canvas = $('#map-canvas'),
	$panelLeft = $('#panel-left'),
	$searchInput = $('#location-search'),
	minZoomLevel = 11,
	map = new google.maps.Map($canvas[0], { 
		zoom: minZoomLevel,
		mapTypeControl: false, 
		backgroundColor: 'none',
		fullscreenControl: false
	}),
	geocoder = new google.maps.Geocoder,
	infoWindow = new google.maps.InfoWindow,
	searchBox = new google.maps.places.Autocomplete($searchInput[0], {
		types: ['(cities)']
	}),
	calculatePan = function() {
		if(winWidth = $(window).width() > 640) {
			return -Math.abs((winWidth/2) - ((winWidth - $panelLeft.width())/2)); 
		}
		return 0;
	},
	calculateProximity = function() {
		var 
		bounds = map.getBounds(),
		sw = bounds.getSouthWest(),
		ne = bounds.getNorthEast();
		return google.maps.geometry.spherical.computeDistanceBetween(sw, ne) / 4;
	},
	addMarker = function(item) {
		new google.maps.Marker({
			position: {
				lat: parseFloat(item.restaurant.location.latitude), 
				lng: parseFloat(item.restaurant.location.longitude)
			},
			title: item.restaurant.name,
			map: map
		});
	};

	// Set observables
	self.ListOfMarkers = ko.observableArray([]);
	self.panelVisible = ko.observable(true);

	self.tooglePanel = function() {
		self.panelVisible(self.panelVisible() ? false : true);
	}

	// Update curent location
	var updateLocation = function(center, proximity) {
		console.log(center.lat(), center.lng(), proximity);
		$.ajax({ // Make Zoomato request based on the curent location center.
			beforeSend: function(request) {
				request.setRequestHeader("user-key", 'bd29606b39e52ba6646834057c5a3da6');
			},
			dataType: "json",
			url: [
				'https://developers.zomato.com/api/v2.1/search?',
				'lat='+center.lat(),
				'lon='+center.lng(),
				'radius='+proximity,
				'sort=rating'
			].join('&'),
			success: function(data) {
				var markers = [];
				$.each(data.restaurants, function(index, item){
					addMarker(item);
					markers.push(item);
				})
				self.ListOfMarkers(markers);
			}
		});
	}




	// Set up UI....
	// ------------------------------------------------------------------------

	// Load map style async...
	$.getJSON('/static/map-style.json', function(data) { 
		map.setOptions({styles:data});
	});

	// Add the ui elements to the map.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft[0]);

	// Set map center and add pan
	google.maps.Map.prototype.setCenterWithPan = function(latLng, beforePan) {
		this.setCenter(latLng);
		beforePan(this);
		this.panBy(calculatePan(), 0);
	}

	// Fit bounds and add pan
	google.maps.Map.prototype.fitBoundsWithPan = function(viewport, beforePan) {
		this.fitBounds(viewport);
		beforePan(this);
		this.panBy(calculatePan(), 0);
	}

	// Lissen for place changed when selected from the location search.
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();
		map.fitBoundsWithPan(location.geometry.viewport, function() { 
			updateLocation(map.getCenter(), calculateProximity());
		});
	});

	// Limit the zoom out level
	google.maps.event.addListener(map, 'zoom_changed', function () {
		if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
	});

	// Center the map when window is resized.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// Initilize the map.
	geocoder.geocode({address: 'Borehamwood, United Kingdom'}, function(results, status) {
		if(status == 'OK') {
			map.fitBoundsWithPan(results[0].geometry.viewport, function() { 
				updateLocation(map.getCenter(), calculateProximity()); 
			});
		}
	});







	// Make sure we update the markers when bonds get changed.
	// bd29606b39e52ba6646834057c5a3da6
	//googleMap.addListener('LocationUpdated', function(test) {
	//	console.log('lool', test);
		/**/
	//});

}

// Execute this function
// when google maps script is ready
// -----------------------------------------------------------------------------
function googleMapsJsLoaded() {
	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}