function initMap() {
    var purdue = {
        lat: 40.423756,
        lng: -86.921542
    };
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: purdue
    });
    var marker = new google.maps.Marker({
        position: purdue,
        map: map
    });
}