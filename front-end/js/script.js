$(document).ready(function(){
    // sidebar
    $('.button-collapse').sideNav({
      menuWidth: 400, // Default is 300
      edge: 'right', // Choose the horizontal origin
      closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    });
});

voronoiMap = function(map, points) {
    var colors = ["#f0f9e8", "#ccebc5", "#a8ddb5", "#7bccc4", "#43a2ca", "#0868ac"];
    var color_scale = d3.scale.quantile()
                        .domain(Object.keys(prices_aggregated).map(function(d) { return prices_aggregated[d].difference }))
                        .range(colors);

    var draw = function() {
    
    var voronoi = d3.distanceLimitedVoronoi()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .limit(170 * map.getZoomScale(map.getZoom(), 13));

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
      //return "M" + point.cell.join("L") + "Z";
      return point.cell.path;
    }

    svgPoints.append("path")
      .attr("class", "point-cell")
      .attr("d", buildPathFromPoint)
      .attr("stroke", "black")
      .attr("fill", function(d) {
        x = prices_aggregated[d.location_cell];
        if (x) return color_scale(x.difference);
        return "none";
      })
      .attr("opacity", .5)
      .attr('style', 'pointer-events:visiblePainted;')
      .on("click", updatePanel)
      .on("mouseenter", function(d) {
        d3.select(this).classed("hovered", true);
      })
      .on("mouseleave", function(d) {
        d3.select(this).classed("hovered", false);
      });

    svgPoints.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style('fill', function(d) {
        x = prices_aggregated[d.cell.point.location_cell];
        return color_scale(x.difference);
      })
      //.style("stroke", "black")
      .attr("r", 4);
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

prices_aggregated = {}

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
            prices_aggregated = price_data;
            voronoiMap(map, points);
       });

function updatePanel(d) {
    document.getElementById("subway-name").textContent = d.name;
    document.getElementById("price-hist-title").style.display = "";

    var diff = prices_aggregated[d.location_cell].difference.toFixed(2);
    if (diff > 0) {
      var priceStr = `Hotel rooms are on average $${diff} more expensive per night than Airbnbs.`;
    } else {
      var priceStr = `Hotel rooms are on average $${(-1 * diff)} less expensive per night than Airbnbs.`;
    }
    document.getElementById("difference-text").textContent = priceStr;

    d3.select(".clicked").classed("clicked", false);
    d3.select(this).classed("clicked", true);

    d3.csv("js/hotels_aggregated2.csv", function(data) {
        data = data.filter(function(curr) {
            return d.location_cell == +curr.location_cell;
        });
        createPriceHist(data);
    });
}

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
    var height = 220 - margin.top - margin.bottom;

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
        .attr("height", function(d) { return height - y(d.y); })
        .attr("fill", "#2980b9");

    g.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);
}