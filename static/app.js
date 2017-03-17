// The app knockoutJs view
// -----------------------------------------------------------------------------
var NeighborhoodMapViewModel = function() {
	var
	self = this,
	$canvas = $('#map-canvas'),
	$panelLeft = $('#panel-left'),
	$infoWindow = $('#info-window'),
	$searchInput = $('#location-search'),
	minZoomLevel = 11,
	map = new google.maps.Map($canvas[0], { 
		zoom: minZoomLevel,
		mapTypeControl: false, 
		backgroundColor: 'none',
		fullscreenControl: false
	}),
	geocoder = new google.maps.Geocoder,
	infoWindow = new google.maps.InfoWindow({
		content: $infoWindow[0]
	}),
	searchBox = new google.maps.places.Autocomplete($searchInput[0], {
		types: ['(cities)']
	});

	// Set observables
	self.restaurants = ko.observableArray([]);
	self.panelVisible = ko.observable(true);
	self.curentRestaurant = ko.observable();

	// Toogle ui panel visability efect only on mobile...
	self.tooglePanel = function() { self.panelVisible(self.panelVisible() ? false : true); }

	var 
	// Calculate by how much to pan the map so is not stuck under the UI.
	// here we only calculate the value based on the window widht and panel width
	calculatePan = function() {
		if(winWidth = $(window).width() > 640) {
			return -Math.abs((winWidth/2) - ((winWidth - $panelLeft.width())/2)); 
		}
		return 0;
	},
	// Calculate the proximity of the visible map
	// we use this to work out the radius in meters for our search with zomato api.
	calculateProximity = function() {
		var 
		bounds = map.getBounds(),
		sw = bounds.getSouthWest(),
		ne = bounds.getNorthEast();
		return google.maps.geometry.spherical.computeDistanceBetween(sw, ne) / 4;
	},
	// Remove all existing markers from the map use this function to keep the map faster.
	clearResturants = function() {
		$.each(self.restaurants(), function(index, item){
			item.marker.setMap(null);
		});
		self.restaurants([]);
	},
	openMarkerInfo = function(item){
		// Set curent resturant...
		self.curentRestaurant(item.restaurant);
		// Open the window info...
		infoWindow.open(map, item.marker);
		// make sure we hide the ui pannel on mobile...
		if(self.panelVisible()) {
			self.tooglePanel(); 
		}
	},
	// Show resturants returned from the zomato api.
	showResturants = function(data) {
		var 
		restaurants = [];
		bounds = new google.maps.LatLngBounds(),
		
		// For all resturants let preforme this function to add marker...
		$.each(data.restaurants, function(index, item){
			var 
			latitude = parseFloat(item.restaurant.location.latitude),
			longitude = parseFloat(item.restaurant.location.longitude);
			// Make sure we add only resturants with corect lat/long.
			if(latitude != 0.00 && longitude != 0.00) {
				// Set the marker for this resturant
				item.marker = new google.maps.Marker({
					title: item.restaurant.name,
					position: new google.maps.LatLng(latitude, longitude),
					icon: "static/map-pin.png",
					map: map
				});
				bounds.extend(item.marker.position);
				restaurants.push(item);
				// Add event lisener to open the info window later.
				google.maps.event.addListener(item.marker, 'click', function() {
					openMarkerInfo(item);
				});
			}
		});
		// Fix bond on the map
		map.fitBoundsWithPan(bounds);
		self.restaurants(restaurants);
	},
	// Update curent location
	updateLocation = function(center, proximity) {
		// First let clear the markers
		clearResturants();
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
				showResturants(data);
			}
		});
	}

	// Load map style async...
	$.getJSON('/static/map-style.json', function(data) { 
		map.setOptions({styles:data});
	});

	// Add the ui elements to the map.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft[0]);

	// Lissen for place changed when selected from the location search.
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();
		map.fitBoundsWithPan(location.geometry.viewport, function() { 
			updateLocation(map.getCenter(), calculateProximity());
		});
	});

	// Limit the zoom out level
	google.maps.event.addListener(map, 'zoom_changed', function () {
		//if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
	});

	// Center the map when window is resized.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// Initilize the map.
	geocoder.geocode({address: 'NY, United States'}, function(results, status) {
		if(status == 'OK') {
			map.fitBoundsWithPan(results[0].geometry.viewport, function() { 
				updateLocation(map.getCenter(), calculateProximity()); 
			});
		}
	});

	// Move the infoWindow so we dont lose the ko bindings.
	google.maps.event.addListener(infoWindow, "closeclick", function () {
		$("#templates").append($infoWindow);
	});

	// Set map center and add pan
	google.maps.Map.prototype.setCenterWithPan = function(latLng, beforePan) {
		this.setCenter(latLng);
		if(typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), 0);
	}

	// Fit bounds and add pan
	google.maps.Map.prototype.fitBoundsWithPan = function(viewport, beforePan) {
		this.fitBounds(viewport);
		if(typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), 0);
	}

}

// Execute this function
// when google maps script is ready
// -----------------------------------------------------------------------------
function googleMapsJsLoaded() {
	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}