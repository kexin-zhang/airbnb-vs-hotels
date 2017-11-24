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
    var colors = ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#2ca25f", "#006d2c"];
    var color_scale = d3.scale.quantile()
                        .domain(Object.keys(prices).map(function(d) { return prices[d].difference }))
                        .range(colors);

    var draw = function() {

    var voronoi = d3.distanceLimitedVoronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .limit(80 * map.getZoomScale(map.getZoom(), 13)) // scale this according to the current map scale

    d3.select('#overlay').remove();

    var bounds = map.getBounds(),
        topLeft = map.latLngToLayerPoint(bounds.getNorthWest()),
        bottomRight = map.latLngToLayerPoint(bounds.getSouthEast()),
        drawLimit = bounds.pad(0.4);

    // filter out points that are outside of the current map boundaries
    // convert lat long to appropriate x, y coordinates for leaflet
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
      .attr("id", "overlay-g")
      .attr("transform", "translate(" + (-topLeft.x) + "," + (-topLeft.y) + ")");

    var svgPoints = g.attr("class", "points")
      .selectAll("g")
        .data(filteredPoints)
        .enter().append("g")
        .attr("class", "point");

    var buildPathFromPoint = function(point) {
      //return "M" + point.cell.join("L") + "Z";
      if (point.cell) {
        return point.cell.path;
      }
      return undefined;
    }

    svgPoints.append("path")
      .attr("class", "point-cell")
      .attr("d", buildPathFromPoint)
      .attr("stroke", "black")
      .attr("fill", function(d) {
        // x = prices[d.location_cell];
        // if (x) return color_scale(x.difference);
        // return "none";
        return "none";
      })
      .attr("opacity", .4)
      .attr('style', 'pointer-events:visiblePainted;')
      .on("click", updatePanel);

    svgPoints.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style('fill', function(d) {
        // x = prices[d.cell.point.location_cell];
        // return color_scale(x.difference);
        return "red";
      })
      .attr("r", 2);
    }

    draw();
    map.on('viewreset moveend', draw); // redraw when map is dragged or zoomed in
}

// init leaflet map
var map = L.map('map');
map.setView([40.7589, -73.9851], 12.5);

var tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoia2V4aW4iLCJhIjoiY2phOHhnMXhnMGF4MzMzbzd2bHE3ejJoeSJ9.0o0DKpfIuhv5QtqxDkbC4A'
});
tiles.addTo(map);

// load coordinates and prices, draw svg on top of leaflet tiles
queue().defer(d3.json, "js/hotels_coordinates.geojson")
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

// function for drawing hotel coordinates
function drawHotels() {
    d3.json("js/hotels_coordinates.geojson", function(data) {
        data.forEach(function(d) {
            var latlng = new L.LatLng(+d.lat, +d.lon);
            var point = map.latLngToLayerPoint(latlng);
            d.x = point.x;
            d.y = point.y;
        });

        var svg = d3.select("#overlay-g");

        svg.selectAll('.hotels')
           .data(data)
           .enter()
           .append("circle")
           .attr("class", "hotels")
           .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
           .style('fill', "red")
           .attr("r", 5);
    });
}

// function for updating the sidebar when a region is clicked
function updatePanel(d) {
    document.getElementById("subway-name").textContent = d.name;
    document.getElementById("price-hist-title").style.display = "";

    d3.csv("js/hotels_aggregated2.csv", function(data) {
        data = data.filter(function(curr) {
            return d.location_cell == +curr.location_cell;
        });
        createPriceHist(data);
    });
}

// draw price distribution histogram
function createPriceHist(data) {
    d3.select("#prices-hist-svg").remove();

    data = data.map(function(d) {
        return +d.total_amount;
    });

    var margin = {
        top: 10,
        left: 10,
        right: 10,
        bottom: 30
    };

    var width = 350 - margin.left - margin.right;
    var height = 250 - margin.top - margin.bottom;

    var svg = d3.select("#prices-hist")
                .append("svg")
                .attr("id", "prices-hist-svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 


    var x = d3.scale.linear()
              .domain([d3.min(data), d3.max(data)])
              .range([0, width]);

    var hist_data = d3.layout.histogram()
                      .bins(x.ticks(6))
                      (data);

    var yMax = d3.max(hist_data, function(d) { 
        return d.length; 
    });

    var y = d3.scale.linear()
              .domain([0, yMax])
              .range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient('bottom');

    var bars = g.selectAll(".bar")
                  .data(hist_data)
                  .enter()
                  .append("g")
                  .attr("class", "bar")
                  .attr("transform", function(d) {
                    return "translate(" + x(d.x) + "," + y(d.y) + ")"
                  });

    bars.append("rect")
        .attr("x", 1)
        .attr("width", (x(hist_data[0].dx) - x(0)) - 1)
        .attr("height", function(d) { console.log(y(d.y)); return height - y(d.y); })
        .attr("fill", "#2980b9");

    g.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);
}