// Google map api object
// use to interact with the google map
// -----------------------------------------------------------------------------
function GoogleMap(initAddress) {
	var
	self = this,
	$canvas = $('#map-canvas'),
	$panelLeft = $('#panel-left'),
	$searchInput = $('#location-search'),
	mapBondsChanging = false,
	geocoder = new google.maps.Geocoder,
	infoWindow = new google.maps.InfoWindow,
	searchBox = new google.maps.places.Autocomplete($searchInput[0], {
		types: ['(cities)']
	});

	// Calculate pan for the map based on the UI width
	var panUI = function() {
		uiWidth =  $panelLeft.width();
		winWidth = $(window).width();
		return (winWidth > 640) ? -Math.abs((winWidth/2) - ((winWidth - uiWidth)/2)) : 0;
	}

	// Create the map object.
	self.map = new google.maps.Map($canvas[0], { 
		zoom: 11,
		mapTypeControl: false, 
		backgroundColor: 'none',
		fullscreenControl: false
	});

	// Load map style async...
	$.getJSON('/static/map-style.json', function(data) { 
		self.map.setOptions({styles:data});
	});

	// Set map center based on the initial address.
	geocoder.geocode({address: initAddress}, function(results, status) {
		if(status == 'OK') {
			self.map.fitBoundsWithPan(results[0].geometry.viewport, panUI());
		} else { // Set defaul center.
			self.map.setCenterWithPan({lat: 51.507378, lng: -0.128171}, panUI());
		}
	});

	// Add the ui elements to the map.
	self.map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft[0]);

	// Lissen for place changed when selected from the location search.
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();
		self.map.fitBoundsWithPan(location.geometry.viewport, panUI());
	});

	// Center the map when window is resized.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = self.map.getCenter();
		google.maps.event.trigger(self.map, "resize");
		self.map.setCenter(center);
	});

	// Fire callback event when bonds get changed delay with 1000ms
	self.onBondsChange = function(callback) {
		google.maps.event.addListener(self.map, 'bounds_changed', function(){
			if(!mapBondsChanging) {
				setTimeout(function() {
					mapBondsChanging = false;
					var bounds = self.map.getBounds();
					var center = self.map.getCenter();
					var ne = bounds.getNorthEast();
					callback({ 
						radius: google.maps.geometry.spherical.computeDistanceBetween(center, ne),
						center: center
					});
				}, 1000);
				mapBondsChanging = true;
			}
		});
	}

	self.addMarker = function(marker) {
		new google.maps.Marker({
			position: marker.location,
			title: marker.title,
			map: self.map
		});
	}

}


// The app knockoutJs view
// -----------------------------------------------------------------------------
var NeighborhoodMapViewModel = function() {
	var 
	self = this,
	googleMap = new GoogleMap("London, UK");

	// Set observables
	self.ListOfMarkers = ko.observableArray([]);

	// Make sure we update the markers when bonds get changed.
	googleMap.onBondsChange(function(bonds) {
		// meters to km
		var radius = bonds.radius/1000;
		console.log(radius, bonds)
		$.getJSON([
		'https://api.flickr.com/services/rest/?method=flickr.photos.search',
		'api_key=9ba0e6cdb83174a03fa1a7bef94a6a49',
		'text=',
		'has_geo=1',
		'lat='+bonds.center.lat(),
		'lon='+bonds.center.lng(),
		'radius='+(radius > 35) ? 35 : radius,
		'extras=tags,+geo',
		'format=json',
		'nojsoncallback=1'].join('&'), function(data){
			var markers = [];
			console.log(data);
			$.each(data.photos.photo, function(index, item){
				var marker = {
					image: 'http://farm' + item.farm + '.static.flickr.com/' + item.server + '/' + item.id + '_' + item.secret + '_z.jpg',
					title: item.title,
					description: item.tags,
					location: {lat: parseFloat(item.latitude), lng: parseFloat(item.longitude)}
				}
				markers.push(marker);
				googleMap.addMarker(marker);
			})
			self.ListOfMarkers(markers);
		});
	});


	// UI functionality --------------------------------------------------------
	self.panelVisible = ko.observable(true);
	self.tooglePanel = function() {
		self.panelVisible(self.panelVisible() ? false : true);
	}

	self.addMarker = ko.observable(false);
	self.toogleAddMarker = function() {
		if(!self.panelVisible()){
			self.tooglePanel();
		}
		self.addMarker(self.addMarker() ? false : true);
	}

}

// Execute this function
// when google maps script is ready
// -----------------------------------------------------------------------------
function googleMapsJsLoaded() {

	// Set map center and add pan
	google.maps.Map.prototype.setCenterWithPan = function(latlng, panBy) {
		this.setCenter(latlng)
		this.panBy(panBy, 0);
	}

	// Fit bounds and add pan
	google.maps.Map.prototype.fitBoundsWithPan = function(viewport, panBy) {
		this.fitBounds(viewport);
		this.panBy(panBy, 0);
	}

	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}