$(document).ready(function(){
    // sidebar
    $('.button-collapse').sideNav({
      menuWidth: 400, // Default is 300
      edge: 'right', // Choose the horizontal origin
      closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    });
});

voronoiMap = function(map, points, prices) {
    var colors = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"];
    var color_scale = d3.scale.quantile()
                        .domain(Object.keys(prices).map(function(d) { return prices[d].difference }))
                        .range(colors);

    console.log(color_scale.quantiles());

    var voronoi = d3.geom.voronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    var draw = function() {
    d3.select('#overlay').remove();

    var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        drawLimit = bounds.pad(0.4);

    filteredPoints = points.filter(function(d) {
      var latlng = new L.LatLng(+d.lat, +d.lon);
      if (!drawLimit.contains(latlng)) { return false };
      var point = map.latLngToLayerPoint(latlng);
      d.location_cell = +d.location_cell;
      d.x = point.x;
      d.y = point.y;
      return true;
    });

    voronoi(filteredPoints).forEach(function(d) { d.point.cell = d; });

    var svg = d3.select(map.getPanes().overlayPane).append("svg")
      .attr('id', 'overlay')
      .attr("class", "leaflet-zoom-hide")
      .style("width", map.getSize().x + 'px')
      .style("height", map.getSize().y + 'px')
      .style("margin-left", topLeft.x + "px")
      .style("margin-top", topLeft.y + "px");

    var g = svg.append("g")
      .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

    var svgPoints = g.attr("class", "points")
      .selectAll("g")
        .data(filteredPoints)
        .enter().append("g")
        .attr("class", "point");

    var buildPathFromPoint = function(point) {
      return "M" + point.cell.join("L") + "Z";
    }

    svgPoints.append("path")
      .attr("class", "point-cell")
      .attr("d", buildPathFromPoint)
      .attr("stroke", "black")
      .attr("fill", function(d) {
        x = prices[d.cell.point.location_cell];
        if (x) return color_scale(x.difference);
        return "none";
      })
      .attr("opacity", .5);

    // svgPoints.append("circle")
    //   .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    //   .style('fill', 'red')
    //   .attr("r", 2);
    }

    draw();
    map.on('viewreset moveend', draw);
}

var map = L.map('map');
map.setView([40.7589, -73.9851], 12.5);

var tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoia2V4aW4iLCJhIjoiY2phOHhnMXhnMGF4MzMzbzd2bHE3ejJoeSJ9.0o0DKpfIuhv5QtqxDkbC4A'
});
tiles.addTo(map);

queue().defer(d3.csv, "js/subways_points.csv")
       .defer(d3.csv, "js/prices_aggregated.csv")
       .await(function(error, points, prices) {
            if (error) throw error;
            price_data = {};
            prices.forEach(function(d) {
                d.hotel_avg = +d.hotel_avg;
                d.airbnb_avg = +d.airbnb_avg;
                price_data[+d.location_cell] = {
                    "hotel_avg": d.hotel_avg,
                    "airbnb_avg": d.airbnb_avg,
                    "difference": d.hotel_avg - d.airbnb_avg
                };
            });
            voronoiMap(map, points, price_data);
       });