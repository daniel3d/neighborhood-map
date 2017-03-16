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
	markers = [],
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
	clearMarkers = function() {
		$.each(markers, function(index, marker){
			marker.setMap(null);
		});
		markers = [];
	},
	dropMarkers = function() {
		$.each(self.restaurants(), function(index, item){
			addMarkerWithTimeout({
				title: item.restaurant.name,
				position: {
					lat: parseFloat(item.restaurant.location.latitude), 
					lng: parseFloat(item.restaurant.location.longitude)
				},
			}, index * 100);
		});
		// Add auto center...
	},
	addMarkerWithTimeout = function (marker, timeout) {
		window.setTimeout(function() {
			markers.push(new google.maps.Marker({
				title: marker.name,
				position: marker.position,
				animation: google.maps.Animation.DROP,
				map: map
			}));
		}, timeout);
	};



	// Set observables
	self.restaurants = ko.observableArray([]);
	self.panelVisible = ko.observable(true);

	// Toogle panel visability
	self.tooglePanel = function() {
		self.panelVisible(self.panelVisible() ? false : true);
	}

	// Update curent location
	var updateLocation = function(center, proximity) {
		// First let clear the markers
		clearMarkers();
		// Make Zoomato request based on the curent location center.
		$.ajax({ 
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
				self.restaurants(data.restaurants);
				dropMarkers();
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

}

// Execute this function
// when google maps script is ready
// -----------------------------------------------------------------------------
function googleMapsJsLoaded() {
	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}