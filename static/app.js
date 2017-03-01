var GoogleMapViewModel = function() {
	var 
		self = this,
		LeftPanel = document.getElementById('left-panel'),
		CanvasElement = document.getElementById('map-canvas'),
		LocationSearchInput = document.getElementById('location-search'),
		GoogleAnimation = window.google.maps.Animation,
		GoogleMap = new window.google.maps.Map(CanvasElement, {
			center: {lat: 51.507378, lng: -0.128171},
			backgroundColor: 'none',
			mapTypeControl: false,
			zoom: 11
		}),
		LocationSearchBox = new google.maps.places.Autocomplete(LocationSearchInput, {
			types: ['(cities)']
		});

		// Offset the map
		GoogleMap.panBy(-200, 0);

		// Lissen for place changed by the location search
		LocationSearchBox.addListener('place_changed', function() {
			var location = LocationSearchBox.getPlace();

			// This is the 2 fields we will restrict the markers
			// country and administrative_area_level_1
			// make sure we restrict the types to (cities)
			$.each(location.address_components, function( index, value ){
				if(value.types[0] == 'country' || value.types[0] == 'administrative_area_level_1'){
					console.log(value);
				}
			});

			GoogleMap.fitBounds(location.geometry.viewport);
		});

		// Set position for the search input.
		GoogleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(LeftPanel);

		// Load map style async...
		$.getJSON('/static/map-style.json', function(data){ 
			GoogleMap.setOptions({styles:data});
		});
};

function mapsLoaded() {
	// Do any pre google maps initilization here.
	ko.applyBindings(new GoogleMapViewModel());
};