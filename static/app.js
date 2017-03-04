var GoogleMapViewModel = function() {
	var 
		self = this,
		weatherApiKey = '&APPID=5e3c6273faa62f18231cc3cfc0c4e96d';
		MapCanvas = document.getElementById('map-canvas'),
		PanelLeft = document.getElementById('panel-left'),
		LocationSearchInput = document.getElementById('location-search'),
		GoogleAnimation = window.google.maps.Animation,
		GoogleMap = new window.google.maps.Map(MapCanvas, {
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
			var city = null;
			var country = null;
			var neigborhood = null;
			var lat = location.geometry.location.lat();
			var lng = location.geometry.location.lng();
			// This is the 2 fields we will restrict the markers
			// country and administrative_area_level_1
			// make sure we restrict the types to (cities)
			$.each(location.address_components, function( index, value ){
				if(	value.types[0] == 'country') {
					country = value.short_name;
				}
				if(	value.types[0] == 'administrative_area_level_1') {
					neigborhood = value.short_name;
				}
				if(	value.types[0] == 'postal_town') {
					city = value.short_name;
				}
			});

			// Get whether...
			var whetherUrlRequest = 'http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lng+weatherApiKey;
			$.getJSON(whetherUrlRequest, function(data){ 
				console.log(data);
			});

			// Set the map center.
			GoogleMap.fitBounds(location.geometry.viewport);
		});

		// Load map style async...
		$.getJSON('/static/map-style.json', function(data){ 
			GoogleMap.setOptions({styles:data});
		});

		// Set Ui elements on the map.
		GoogleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(PanelLeft);

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