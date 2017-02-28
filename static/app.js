ko.bindingHandlers.googleMaps = {
	init(mapDiv, valueAccessor) {
		var 
		Options = ko.unwrap(valueAccessor()) || {},	 
		GoogleAnimation = window.google.maps.Animation,
		GoogleMap = new window.google.maps.Map(mapDiv, {
			center: Options.center,
			mapTypeControl: false,
			zoom: Options.zoom,
			styles: Options.styles,
      }),
      Markers = $.map(Options.markers, function(data) {
        data.map = GoogleMap;
        data.animation = GoogleAnimation[data.animationName] || GoogleAnimation.BOUNCE;
        return new window.google.maps.Marker(data);
      });
  }
};

var GoogleMapViewModel = function() {

	var self = this;

   self.mapOptions = ko.observable({
      center: {lat: 40.674, lng: -73.945},
      zoom: 14,
      styles: [],
      markers: [{
        position: {lat: 40.674, lng: -73.945},
          title: 'EXPRESS LIVE!'
      }]
   });

   //self.mapStyles = ko.observableArray([]);


   // Load style for the map
	$.getJSON('/static/map-style.json', function(data) {
		console.log(data);
		self.mapOption.sstyles = data;
	});
}

// Kick the app when google maps is ready.
function mapsLoaded() {
  // Do any initilization here...
  ko.applyBindings(new GoogleMapViewModel());
};



/*
// Add google map
ko.bindingHandlers.googlemap = {
    init: function (element, valueAccessor) {
        var
          value = valueAccessor(),
          latLng = new google.maps.LatLng(value.latitude, value.longitude),
          mapOptions = {
            zoom: 10,
            center: latLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
            },
          map = new google.maps.Map(element, mapOptions),
          marker = new google.maps.Marker({
            position: latLng,
            map: map
          });
    }
};

var NeighborhoodMap = function() {
  // App specifics goes here...
  var self = this;

  // Map center...
  self.center = ko.observable({latitude: 41.48 , longitude: -81.67});

};

// Kick the app when google maps is ready.
function mapsLoaded() {
  // Do any initilization here...
  ko.applyBindings(new NeighborhoodMap());
};




*/







function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.674, lng: -73.945},
      zoom: 12,
      styles: mapStyle,
      backgroundColor: 'none',
      mapTypeControl: false,
    });

    map.panBy(-200, 0);

    var card = document.getElementById('pac-card');
    var input = document.getElementById('pac-input');

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

    var autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['(cities)']
    });

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var marker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });

    autocomplete.addListener('place_changed', function() {
      infowindow.close();
      marker.setVisible(false);
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  // Why 17? Because it looks good.
      }
      marker.setPosition(place.geometry.location);
      marker.setVisible(true);

      map.panBy(-200, 0);

      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }

      infowindowContent.children['place-icon'].src = place.icon;
      infowindowContent.children['place-name'].textContent = place.name;
      infowindowContent.children['place-address'].textContent = address;
      infowindow.open(map, marker);
    });
}
