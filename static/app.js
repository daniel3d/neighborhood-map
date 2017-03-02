var GoogleMapViewModel = function() {
	var 
		self = this,
		Menu = document.getElementById('menu'),
		Panel = document.getElementById('panel'),
		CanvasElement = document.getElementById('map-canvas'),
		LocationSearchInput = document.getElementById('location-search'),
		GoogleAnimation = window.google.maps.Animation,
		GoogleMap = new window.google.maps.Map(CanvasElement, {
			mapTypeControl: false,
			fullscreenControl: false,
			center: {lat: 51.507378, lng: -0.128171},
			backgroundColor: 'none',
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

		// Load map style async...
		$.getJSON('/static/map-style.json', function(data){ 
			GoogleMap.setOptions({styles:data});
		});

		// Set Ui elements on the map.
		GoogleMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(Menu);
		GoogleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(Panel);

		// UI Mobile
		//------------------------------------------------------------------------
		self.panelVisible = ko.observable(true);
		self.tooglePanel = function() {
			self.panelVisible(self.panelVisible() ? false : true);
			console.log(self.panelVisible());
		}

};

function mapsLoaded() {
	// Do any pre google maps initilization here.
	ko.applyBindings(new GoogleMapViewModel());
};