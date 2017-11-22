$(document).ready(function(){
    // sidebar
    $('.button-collapse').sideNav({
      menuWidth: 400, // Default is 300
      edge: 'right', // Choose the horizontal origin
      closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    }
    );
});

// init map
var map = L.map('map').setView([40.7589, -73.9851], 12.5);
var tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoia2V4aW4iLCJhIjoiY2phOHhnMXhnMGF4MzMzbzd2bHE3ejJoeSJ9.0o0DKpfIuhv5QtqxDkbC4A'
});
tiles.addTo(map);

d3.json("js/regions.json", function(data) {
    data.forEach(function(d) {
        L.polygon(d).addTo(map);
    });
});

d3.json("js/hotels_coordinates.geojson", function(data) {
    data.forEach(function(d) {
        var circle = L.circle([d.lat, d.lon], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 7
        }).addTo(map);
    });
});