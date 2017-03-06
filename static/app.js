// Extract address components from location.
// Use this function to return { city, country, neigborhood }
function extractAddressComponents(location) {
	var 
	result = { 
		city: null,
		country: null,
		neigborhood: null
	},
	lat = location.geometry.location.lat(),
	lng = location.geometry.location.lng();
	// This is the 2 fields we will restrict the markers
	// country and administrative_area_level_1
	// make sure we restrict the types to (cities)
	$.each(location.address_components, function(index, value) {
		switch(value.types[0]) {
			case 'country':
				result.country = value.short_name;
				break;
			case 'administrative_area_level_1':
				result.neigborhood = value.short_name;
				break;
			case 'postal_town':
				result.city = value.short_name;
				break;
		}
	});
	return result;
}

// Google map api object
// use to interact with the google map
function GoogleMap(mapCenterlatlng) {
	var
	self = this,
	$canvas = $('#map-canvas'),
	$panelLeft = $('#panel-left'),
	$searchInput = $('#location-search'),
	geocoder = new google.maps.Geocoder,
	infoWindow = new google.maps.InfoWindow,
	searchBox = new google.maps.places.Autocomplete($searchInput[0], {
		types: ['(cities)']
	});

	self.map = new google.maps.Map($canvas[0], {
		mapTypeControl: false,
		fullscreenControl: false,
		center: mapCenterlatlng,
		backgroundColor: 'none',
		zoom: 11
	});

	// Set map center based on the UI width
	google.maps.Map.prototype.setUiCenter = function(latlng) {
		uiWidth =  $panelLeft.width();
		winWidth = $(window).width();
		panBy = (winWidth > 640) ? -Math.abs((winWidth/2) - ((winWidth - uiWidth)/2)) : 0;
		console.log([uiWidth, winWidth, panBy]);
		self.map.setCenter(latlng)
		self.map.panBy(panBy, 0);
	}

	// Set position of the Ui elements on the map.
	self.map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft[0]);

	// Move the map to the side
	// TODO: on mobile we need to make sure this dont execute...
	self.map.panBy(-200, 0);

	// Lissen for place changed by the location search
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();

		// Set the map center.
		self.map.fitBounds(location.geometry.viewport);
	});

	// Load map style async...
	$.getJSON('/static/map-style.json', function(data){ 
		self.map.setOptions({styles:data});
	});

	// Center the map on resizing.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = self.map.getCenter();
		google.maps.event.trigger(self.map, "resize");
		self.map.setCenter(center);
	});

	// Create marker to the map
	// ------------------------------------------------------------------------
	self.createMarker = function(latlng, iconSvgUrl, animation) {
		var marker = new google.maps.Marker({
			position: latlng,
			map: self.map,
			icon: new google.maps.MarkerImage(iconSvgUrl, 
				null, null, null, new google.maps.Size(40,40)),
			animation: animation,
			draggable: true,
			optimized: false
		});
		
		// Center the map to the new marker
		self.map.setZoom(17);
		self.map.setUiCenter(marker.position);
	}

	google.maps.event.addListener(self.map, 'click', function(event) {
		self.createMarker(event.latLng, "static/maps-and-flags.svg", google.maps.Animation.DROP);
	});
}


// The app knockoutJs view
// Here we initilize every thing..
var NeighborhoodMapViewModel = function() {
	var 
	self = this,
	googleMap = new GoogleMap({lat: 51.507378, lng: -0.128171});


	// Add marker
	self.addMarker = function() {
		googleMap.createMarker(googleMap.map.getCenter(), "static/push-pin.svg", google.maps.Animation.BOUNCE);
	}

	// UI Mobile
	//------------------------------------------------------------------------
	self.panelVisible = ko.observable(true);
	self.tooglePanel = function() {
		self.panelVisible(self.panelVisible() ? false : true);
	}

}

// Execute this function
// when google maps script is ready
function googleMapsJsLoaded() {

	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}