var NeighborhoodMapViewModel = function() {
	var
		self = this,
		canvas = document.getElementById("map-canvas"),
		panelLeft = document.getElementById("panel-left"),
		searchInput = document.getElementById("location-search"),
		minZoomLevel = 11,
		firstInfoWindowOpening = true,
		map = new google.maps.Map(canvas, {
			zoom: minZoomLevel,
			mapTypeControl: false,
			backgroundColor: 'none',
			fullscreenControl: false
		}),
		geocoder = new google.maps.Geocoder,
		infoWindow = new google.maps.InfoWindow({
			disableAutoPan: true
		}),
		searchBox = new google.maps.places.Autocomplete(searchInput, {
			types: ['(cities)']
		});

	// Set observables
	self.curentMarker = ko.observable();
	self.curentRestaurant = ko.observable();
	self.restaurants = ko.observableArray([]);
	self.cuisines = ko.observableArray([]);
	self.panelVisible = ko.observable(true);
	self.filterVisible = ko.observable(false);
	self.status = ko.observable({
		icon: '',
		text: '',
		loading: false
	});

	// Toogle ui panel visability efect only on mobile...
	self.tooglePanel = function(){ self.panelVisible(self.panelVisible() ? false : true); }
	// Toogle ui panel visability efect only on mobile...
	self.toogleFilter = function(){ self.filterVisible(self.filterVisible() ? false : true); }
	// Open marker info.
	self.openMarkerInfo = function(item){
		// Set the curent marker and resturant.
		self.curentMarker(item.marker);
		self.curentRestaurant(item.restaurant);
		// Zoom closer.
		map.setZoom(15);
		// Add marker animation and turn it off after 1sec.
		item.marker.setIcon("assets/map-pin-no-shadow.png");
		item.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){ 
			item.marker.setAnimation(null);
			item.marker.setIcon("assets/map-pin.png"); 
		}, 1500);
		// Harcode template as Required by the udacity reviewr.
		infoWindow.setContent("<section id=\"info-window\"> \
			<article class=\"info-window\"> \
				<div class=\"info-image\" data-bind=\"style: {'backgroundImage': 'url('+ curentRestaurant().thumb +')'}\"></div> \
				<header class=\"info-title\"> \
					<p data-bind=\"text: curentRestaurant().cuisines\"></p> \
					<h5 data-bind=\"text: curentRestaurant().name\"></h5> \
					<div class=\"item-rating\"> \
						<span class=\"ratings\" data-bind=\"css: curentRestaurant().user_rating.rating_class\"></span> \
						<small> \
							<span data-bind=\"text: curentRestaurant().user_rating.aggregate_rating\"></span> / \
							<span data-bind=\"text: curentRestaurant().user_rating.votes\"></span> \
							<ul> \
								<li title=\"Street View\"><a href=\"#\" data-bind=\"click: openStreetViewForTheCurentMarker\"><i class=\"material-icons\">streetview</i></a></li> \
								<li title=\"Photo Galery\"><a data-bind=\"attr: { href: curentRestaurant().photos_url }\" target=\"_blank\"><i class=\"material-icons\">photo</i></a></li> \
								<li title=\"Restaurant Menu\"><a data-bind=\"attr: { href: curentRestaurant().menu_url }\" target=\"_blank\"><i class=\"material-icons\">map</i></a></li> \
							</ul> \
						</small> \
					</div> \
				</header> \
				<hr> \
				<p div class=\"info-content\"> \
					<b>Address: </b> <span data-bind=\"text: curentRestaurant().location.address\"></span><br> \
					<b>Avarage cost for two: </b> <span data-bind=\"text: curentRestaurant().currency + '' + curentRestaurant().average_cost_for_two\"></span> \
				</p> \
			</article> \
		</section>");
		// Open the marker on the map.
		infoWindow.open(map, item.marker);
		// Apply this bindings to the newly rendered element.
		ko.applyBindings(self, document.getElementById("info-window"));
		// Center the map on the marker
		map.setCenterWithPan(item.marker.getPosition(), -$(document.getElementById("info-window")).height());
		// make sure we hide the ui pannel on mobile...
		if (self.panelVisible()) { self.tooglePanel(); }
		// Scroll to the curent restaurant and make it active
		scrollToCurentResturant();
	}
	// Open Street view for the curent resturant.
	self.openStreetViewForTheCurentMarker = function(){
		if(self.curentMarker()) {
			panorama = map.getStreetView();
			panorama.setPosition(self.curentMarker().getPosition());
			panorama.setPov({ heading: 10, pitch: 10, zoom: 1 });
			panorama.setVisible(true);
			google.maps.event.trigger(panorama, 'resize');
		}
	}

	var
		// Set the status to notify the user what we are doing.
		setStatus = function(update){
			self.status($.extend({}, self.status(), update));
		},
		// Calculate by how much to pan the map so is not stuck under the UI.
		// here we only calculate the value based on the window widht and panel width
		calculatePan = function(){
			// Only calculate on bigger than mobile.
			// We put the ui on top of the map so no pan needed.
			var winWidth = $(window).width();
			if (winWidth > 640) {
				return -Math.abs((winWidth / 2) - ((winWidth - $(panelLeft).width()) / 2)) - 15;
			}
			return 0;
		},
		// Generate css class based on actual rating value.
		generateRatingClass = function(value){
			var rating_class;
			switch(Math.round(value * 2) / 2) {
				case 1.0:
					rating_class = 'one';
					break; 
				case 1.5:
					rating_class = 'onehalf';
					break;
				case 2.0:
					rating_class = 'two';
					break;
				case 2.5:
					rating_class = 'twohalf';
					break;
				case 3.0:
					rating_class = 'three';
					break;
				case 3.5:
					rating_class = 'threehalf';
					break;
				case 4.0:
					rating_class = 'four';
					break;
				case 4.5:
					rating_class = 'fourhalf';
					break;
				case 5.0:
					rating_class = 'five';
					break;
				default:
					rating_class = '';
			}
			return rating_class;
		},
		// Calculate the proximity of the visible map
		// we use this to work out the radius in meters for our search with zomato api.
		calculateProximity = function(){
			var
				bounds = map.getBounds(),
				sw = bounds.getSouthWest(),
				ne = bounds.getNorthEast();
			return google.maps.geometry.spherical.computeDistanceBetween(sw, ne) / 4;
		},
		// Remove all existing markers from the map use this function to keep the map faster.
		clearrestaurants = function(){
			// Remove the markers from the map.
			$.each(self.restaurants(), function(index, item){
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
		showrestaurants = function(data){
			var restaurants = [],
				cuisines = [],
				bounds = new google.maps.LatLngBounds();
			// For all restaurants let preforme this function to add marker...
			$.each(data.restaurants, function(index, item){
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
					// Set class for rating so we can use later in the view.
					item.restaurant.user_rating.rating_class = generateRatingClass(item.restaurant.user_rating.aggregate_rating);
					// Let extend the visible bonds of the map
					bounds.extend(item.marker.position);
					// Push to updated item to the list.
					restaurants.push(item);
					// Add event lisener to open the info window later.
					google.maps.event.addListener(item.marker, 'click', function() {
						self.openMarkerInfo(item);
					});
					// let store the cuisines in array format for easy access later.
					item.cuisines = item.restaurant.cuisines.split(",").map(function(item) {
  						return item.trim();
					});
					// Let update curent list of cuisines..
					cuisines = cuisines.concat(item.cuisines);
				}
			});
			// Make sure we have some resturants
			if (restaurants.length > 0) {
				// Fix bond on the map
				map.fitBoundsWithPan(bounds, 0);
				self.restaurants(restaurants);
				self.cuisines(cuisines);
			} else {
				// If no resturants let notify the user.
				setStatus({ text: "No restaurants found in this area!", icon: "priority_high" });
			}
		},
		// Update curent location
		updateLocation = function(center, proximity){
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
				].join('&') 
			})
			// Handle succesful ajax.
			.done(function(data) {
				setStatus({ text: "", loading: false });
				showrestaurants(data);
			})
			// Handle error.
			.fail(function() {
				setStatus({ text: "Oops! We had a problem, please try again.", icon: "warning" });
			});
		},
		// Scroll to active resturant in the list
		scrollToCurentResturant = function(){
			if(self.curentRestaurant()) {
				var
					$resturantItem = $("#restaurant_" + self.curentRestaurant().id),
					$resturantsList = $('.panel-items');
				$resturantsList.animate({
					scrollTop: $resturantsList.scrollTop() + $resturantItem.position().top - $resturantsList.position().top
				}, 700);
			}
		};

	// Load map style async...
	$.getJSON('assets/map-style.json')
		.done(function(data) {
			map.setOptions({ styles: data });
		})
		.fail(function() {
			ErrorLoading('Oops! Cannot load the map style json file, please make sure you read the README.md');
		});


	// Add the ui elements to the map.
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(panelLeft);

	// Lissen for place changed when selected from the location search.
	searchBox.addListener('place_changed', function(){
		var location = searchBox.getPlace();
		map.fitBoundsWithPan(location.geometry.viewport, 0, function(){
			updateLocation(map.getCenter(), calculateProximity());
		});
	});

	// Limit the zoom out level
	google.maps.event.addListener(map, 'zoom_changed', function(){
		//if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
	});

	// Center the map when window is resized.
	google.maps.event.addDomListener(window, "resize", function(){
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// Initilize the map.
	geocoder.geocode({ address: 'NY, United States' }, function(results, status){
		if (status == 'OK') {
			map.fitBoundsWithPan(results[0].geometry.viewport, 0, function() {
				updateLocation(map.getCenter(), calculateProximity());
			});
		}
	});

	// Set map center and add pan
	google.maps.Map.prototype.setCenterWithPan = function(latLng, topOffset, beforePan){
		this.setCenter(latLng);
		if (typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), topOffset);
	}

	// Fit bounds and add pan
	google.maps.Map.prototype.fitBoundsWithPan = function(viewport, topOffset, beforePan){
		this.fitBounds(viewport);
		if (typeof beforePan === "function") beforePan(this);
		this.panBy(calculatePan(), topOffset);
	}

}
