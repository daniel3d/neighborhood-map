<!DOCTYPE html>
<html>
<head>
	<title></title>
	<link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
</head>
<body>


	<div class="menu">
		
	</div>

	<input id="map-search" class="controls" type="text" placeholder="Search Box">
	<div id='map-canvas'></div>
	




    <script src="{{ url_for('static', filename='map-style.json') }}"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCUtjsz5EVKSHBw8rJMFBeASAyZQKOkGA4&libraries=places&callback=initMap" async defer></script>

	<script>
		function initMap() {
		
			var map = new google.maps.Map(document.getElementById("map-canvas"), {
				center: {lat: 40.674, lng: -73.945},
				mapTypeControl: false,
				zoom: 12,
				styles: mapStyle,
				backgroundColor: 'none'
			});





			// SERCH BOX 
			// -------------------------------------------------------------------------------------

			// Create the search box and link it to the UI element.
			var input = document.getElementById('map-search');
			var searchBox = new google.maps.places.Autocomplete(input, {
				types: ['(regions)']
			});
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

			// Bias the SearchBox results towards current map's viewport.
			map.addListener('bounds_changed', function() {
				searchBox.setBounds(map.getBounds());
			});

			var markers = [];
			// Listen for the event fired when the user selects a prediction and retrieve
			// more details for that place.
			searchBox.addListener('places_changed', function() {
			  var places = searchBox.getPlaces();

			  if (places.length == 0) {
			    return;
			  }

			  // Clear out the old markers.
			  markers.forEach(function(marker) {
			    marker.setMap(null);
			  });
			  markers = [];

			  // For each place, get the icon, name and location.
			  var bounds = new google.maps.LatLngBounds();
			  places.forEach(function(place) {
			    if (!place.geometry) {
			      console.log("Returned place contains no geometry");
			      return;
			    }
			    var icon = {
			      url: place.icon,
			      size: new google.maps.Size(71, 71),
			      origin: new google.maps.Point(0, 0),
			      anchor: new google.maps.Point(17, 34),
			      scaledSize: new google.maps.Size(25, 25)
			    };


			    // MARKER
			    // ---------------------------------------------------------------------------------
				var contentString = '<div id="content">'+
				  '<div id="siteNotice">'+
				  '</div>'+
				  '<h1 id="firstHeading" class="firstHeading">'+place.name+'</h1>'+
				  '<div id="bodyContent">'+
				  '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
				  'sandstone rock formation in the southern part of the '+
				  'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
				  'south west of the nearest large town, Alice Springs; 450&#160;km '+
				  '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
				  'features of the Uluru - Kata Tjuta National Park. Uluru is '+
				  'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
				  'Aboriginal people of the area. It has many springs, waterholes, '+
				  'rock caves and ancient paintings. Uluru is listed as a World '+
				  'Heritage Site.</p>'+
				  '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
				  'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
				  '(last visited June 22, 2009).</p>'+
				  '</div>'+
				  '</div>';

				var infowindow = new google.maps.InfoWindow({
					content: contentString
				});

				var marker = new google.maps.Marker({
				      map: map,
				      icon: icon,
				      title: place.name,
				      position: place.geometry.location
				});

				marker.addListener('click', function() {
					infowindow.open(map, marker);
				});

			    // Create a marker for each place.
			    markers.push(marker);
			    // --------------------------------------------------------------------------------


			    if (place.geometry.viewport) {
			      // Only geocodes have viewport.
			      bounds.union(place.geometry.viewport);
			    } else {
			      bounds.extend(place.geometry.location);
			    }
			  });
			  map.fitBounds(bounds);
			});
			// -------------------------------------------------------------------------------------



      	}
    </script>

</body>
</html>	































    <div class="pac-card" id="pac-card">
      <div>
        <div id="title">
          Search your city
        </div>
      </div>
      <div id="pac-container">
        <input id="pac-input" type="text"
            placeholder="Enter a location">
      </div>
    </div>
    <div id="map"></div>


    <div id="infowindow-content">
      <img src="" width="16" height="16" id="place-icon">
      <span id="place-name"  class="title"></span><br>
      <span id="place-address"></span>
    </div>