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
			disableAutoPan: true,
			content: $infoWindow[0]
		}),
		searchBox = new google.maps.places.Autocomplete($searchInput[0], {
			types: ['(cities)']
		});

	// Set observables
	self.restaurants = ko.observableArray([]);
	self.panelVisible = ko.observable(true);
	self.curentRestaurant = ko.observable();
	self.status = ko.observable({
		icon: '',
		text: '',
		loading: false
	});

	// Toogle ui panel visability efect only on mobile...
	self.tooglePanel = function() { self.panelVisible(self.panelVisible() ? false : true); }
	// Open marker info.
	self.openMarkerInfo = function(item) {
		// Set curent restaurant...
		self.curentRestaurant(item);
		// Zoom closer.
		map.setZoom(15);
		// Open the window info...
		infoWindow.open(map, item.marker);
		// Center the map on the marker
		map.setCenterWithPan(item.marker.getPosition(), -$infoWindow.height());
		// make sure we hide the ui pannel on mobile...
		if (self.panelVisible()) { self.tooglePanel(); }
		// Scroll to the curent resturant and make it active
		scrollToResturantInList(item.restaurant.id);
	}
	// Open Street View
	self.openStreetView = function(item) {
		item = (item.curentRestaurant) ? item.curentRestaurant() : item;
		panorama = map.getStreetView();
		panorama.setPosition(item.marker.getPosition());
		// update the point of view
		panorama.setPov({ heading: 34, pitch: 10, zoom: 1 });
		panorama.setVisible(true);
		google.maps.event.trigger(panorama, 'resize');
	}

	var
		// Set the status to notify the user what we are doing.
		setStatus = function(update) {
			self.status($.extend({}, self.status(), update));
		},
		// Calculate by how much to pan the map so is not stuck under the UI.
		// here we only calculate the value based on the window widht and panel width
		calculatePan = function() {
			// Only calculate on bigger than mobile.
			// We put the ui on top of the map so no pan needed.
			var winWidth = $(window).width();
			if (winWidth > 640) {
				return -Math.abs((winWidth / 2) - ((winWidth - $panelLeft.width()) / 2)) - 15;
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
		clearrestaurants = function() {
			// Remove the markers from the map.
			$.each(self.restaurants(), function(index, item) {
			    item.marker.setMap(null);
			});
			// Clean the list of restaurants
			self.restaurants([]);
			// Make sure we close any open info window.
			infoWindow.close();
			// Also make sure we fire closeclick as we may be lissening for it.
			google.maps.event.trigger(infoWindow, "closeclick");
		},
		// Show restaurants returned from the zomato api.
		showrestaurants = function(data) {
			var restaurants = [];
			bounds = new google.maps.LatLngBounds(),
			// For all restaurants let preforme this function to add marker...
			$.each(data.restaurants, function(index, item) {
			    var
					latitude = parseFloat(item.restaurant.location.latitude),
					longitude = parseFloat(item.restaurant.location.longitude);
				// Make sure we add only restaurants with corect lat/long.
				if (latitude != 0.00 && longitude != 0.00) {
					// Set the marker for this restaurant
					item.marker = new google.maps.Marker({
						title: item.restaurant.name,
						position: new google.maps.LatLng(latitude, longitude),
						icon: "assets/map-pin.png",
						map: map
					});
					bounds.extend(item.marker.position);
					restaurants.push(item);
					// Add event lisener to open the info window later.
					google.maps.event.addListener(item.marker, 'click', function() {
						self.openMarkerInfo(item);
					});
				}
			});
			// Make sure we have some resturants
			if (restaurants.length > 0) {
				// Fix bond on the map
				map.fitBoundsWithPan(bounds, 0);
				self.restaurants(restaurants);
			} else {
				// If no resturants let notify the user.
				setStatus({ text: "No restaurants found in this area!", icon: "priority_high" });
			}
		},
		// Update curent location
		updateLocation = function(center, proximity) {
			// First let clear the markers
			setStatus({ text: "Searching for restaurants...", icon: "location_on", loading: true });
			clearrestaurants();
			// Make Zoomato request based on the curent location center.
			$.ajax({
				beforeSend: function(request) {
					request.setRequestHeader(atob('dXNlci1rZXk='), atob('YmQyOTYwNmIzOWU1MmJhNjY0NjgzNDA1N2M1YTNkYTY='));
				},
				dataType: "json",
				url: [
					'https://developers.zomato.com/api/v2.1/search?',
					'lat=' + center.lat(),
					'lon=' + center.lng(),
					'radius=' + proximity,
					'sort=rating'
				].join('&'),
				success: function(data) {
					setStatus({ text: "", loading: false });
					showrestaurants(data);
				}
			});
		},
		// Scroll to active resturant in the list
		scrollToResturantInList = function(id) {
			var
				$resturantItem = $("#restaurant_" + id),
				$resturantsList = $('.panel-items');
			$(".panel-item.active").removeClass("active");
			$resturantItem.addClass('active');
			$resturantsList.animate({
				scrollTop: $resturantsList.scrollTop() + $resturantItem.position().top - $resturantsList.position().top
			}, 700);
		};

	// Load map style async...
	$.getJSON('assets/map-style.json', function(data) {
		map.setOptions({ styles: data });
	});

	// Add the ui elements to the map.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push($panelLeft[0]);

	// Lissen for place changed when selected from the location search.
	searchBox.addListener('place_changed', function() {
		var location = searchBox.getPlace();
		map.fitBoundsWithPan(location.geometry.viewport, 0, function() {
			updateLocation(map.getCenter(), calculateProximity());
		});
	});

	// Limit the zoom out level
	google.maps.event.addListener(map, 'zoom_changed', function() {
		//if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
	});

	// Center the map when window is resized.
	google.maps.event.addDomListener(window, "resize", function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// Initilize the map.
	geocoder.geocode({ address: $searchInput.val() }, function(results, status) {
		if (status == 'OK') {
			map.fitBoundsWithPan(results[0].geometry.viewport, 0, function() {
				updateLocation(map.getCenter(), calculateProximity());
			});
		}
	});

	// Move the infoWindow so we dont lose the ko bindings.
	google.maps.event.addListener(infoWindow, "closeclick", function() {
		$("#templates").append($infoWindow);
		$(".panel-item.active").removeClass("active");
	});

	// Set map center and add pan
	google.maps.Map.prototype.setCenterWithPan = function(latLng, topOffset, beforePan) {
		this.setCenter(latLng);
		if (typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), topOffset);
	}

	// Fit bounds and add pan
	google.maps.Map.prototype.fitBoundsWithPan = function(viewport, topOffset, beforePan) {
		this.fitBounds(viewport);
		if (typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), topOffset);
	}

}

// Execute this function
// when google maps script is ready
// -----------------------------------------------------------------------------
function googleMapsJsLoaded() {
	// Boostrap the application ui.
	ko.applyBindings(new NeighborhoodMapViewModel());
}

// Load google maps api
$.getScript("https://maps.googleapis.com/maps/api/js?"+
	atob('a2V5PUFJemFTeUNVdGpzejVFVktTSEJ3OHJKTUZCZUFTQXlaUUtPa0dBNA==')+
	"&libraries=places,geometry&callback=googleMapsJsLoaded", function () {});
