var map = {}; // google maps object
var routeOrigin = {}; // origin of the search
var markers = [];

// sets all the markers from a result from the /places endpoint
var setMarkers = function(places) {
    // Clear out the old markers.
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

    places.forEach(function(place) {
        var marker = new google.maps.Marker({
            map: map,
            title: place.name,
            position: place.location
        });
        var infowindow = new google.maps.InfoWindow({
            content: "<h6>" + place.name + "</h6><p>" + round(metersToMiles(place.distance), 2) + ' miles'
        });
        marker.addListener('click', function() {
            infowindow.open(map, marker);
            var directionsService = new google.maps.DirectionsService;
            var directionsDisplay = new google.maps.DirectionsRenderer;

            directionsDisplay.setMap(map);

            calculateAndDisplayRoute(directionsService, directionsDisplay);

            function calculateAndDisplayRoute(directionsService, directionsDisplay) {
                directionsService.route({
                    origin: routeOrigin.geometry.location,
                    destination: place.location,
                    travelMode: 'WALKING'
                }, function(response, status) {
                    if (status === 'OK') {
                        directionsDisplay.setDirections(response);
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            }
        });
        markers.push(marker);
    });
}

function initMap() {

    var purdue = {
        lat: 40.423756,
        lng: -86.921542
    };

    map = new google.maps.Map(document.getElementById('map'), {
        center: purdue,
        zoom: 11,
        mapTypeId: 'roadmap'
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

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

        // set the origin
        routeOrigin = places[0];

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

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

    });
}
// JQuery main function
$(function() {
    $('#submit').click(function() {
        // Get the possible destinations
        var radius = milesToMeters(parseFloat($('#distance').val()));
        var location = routeOrigin.geometry.location.lat() + "," + routeOrigin.geometry.location.lng();
        $.get('/places?radius=' + encodeURIComponent(radius) + '&location=' + encodeURIComponent(location), {}, function(res) {
            console.log(res);
            setMarkers(res);
        })
    });
})

function milesToMeters(miles) {
    return miles * 1609;
}

function metersToMiles(meters) {
    return meters / 1609;
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}