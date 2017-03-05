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
	$canvas = document.getElementById('map-canvas'),
	$panelLeft = document.getElementById('panel-left'),
	$searchInput = document.getElementById('location-search'),
	map = new google.maps.Map($canvas, {
		mapTypeControl: false,
		fullscreenControl: false,
		center: mapCenterlatlng,
		backgroundColor: 'none',
		zoom: 11
	}),
	geocoder = new google.maps.Geocoder,
	infoWindow = new google.maps.InfoWindow,
	searchBox = new google.maps.places.Autocomplete($searchInput, {
		types: ['(cities)']
	});

	// Set position of the Ui elements on the map.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft);

	// Move the map to the side
	// TODO: on mobile we need to make sure this dont execute...
	map.panBy(-200, 0);

	// Lissen for place changed by the location search
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();

		// Set the map center.
		map.fitBounds(location.geometry.viewport);
	});

	// Load map style async...
	$.getJSON('/static/map-style.json', function(data){ 
		map.setOptions({styles:data});
	});

	// Center the map on resizing.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// Use this functin when adding new marker so we can save it in the database.
	// Witht he corect country, city and neigborhood
	function geocodeLatLng(latlng, geocoder, map, infowindow) {
		geocoder.geocode({'location': latlng}, function(results, status) {
			if (status === 'OK') {
				if (results[1]) {
					map.setZoom(11);
					var marker = new google.maps.Marker({
					position: latlng,
					map: map
					});
					infowindow.setContent(results[1].formatted_address);
					infowindow.open(map, marker);
				} else {
					window.alert('No results found');
				}
			} else {
				window.alert('Geocoder failed due to: ' + status);
			}
		});
	}
	geocodeLatLng(mapCenterlatlng, geocoder, map, infoWindow);
	google.maps.event.addListener(map, 'click', function(event) {
		geocodeLatLng(event.latLng, geocoder, map, infoWindow);
	});
}


// The app knockoutJs view
// Here we initilize every thing..
var NeighborhoodMapViewModel = function() {
	var 
	self = this,
	googleMap = new GoogleMap({lat: 51.507378, lng: -0.128171});

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

      var dialog = document.querySelector('#add-marker');
      var showDialogButton = document.querySelector('#add-marker-button');
      if (! dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
      }
      showDialogButton.addEventListener('click', function() {
        dialog.showModal();
      });
      dialog.querySelector('.close').addEventListener('click', function() {
        dialog.close();
      });

	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}