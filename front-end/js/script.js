$(document).ready(function(){
    // sidebar
    $('.button-collapse').sideNav({
      menuWidth: 400, // Default is 300
      edge: 'right', // Choose the horizontal origin
      closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    });
});

var last_selected; // for keeping track of clicked region

voronoiMap = function(map, points) {
    var colors = ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#08589e"];
    var color_scale = d3.scale.quantile()
                        .domain(Object.keys(prices_aggregated).map(function(d) { return prices_aggregated[d].difference; }))
                        .range(colors);

    var draw = function() {      
      var voronoi = d3.distanceLimitedVoronoi()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .limit(100 * map.getZoomScale(map.getZoom(), 13));

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
        .attr("opacity", .4)
        .attr('style', 'pointer-events:visiblePainted;')
        .classed("clicked", function(d) {
          return d.location_cell == last_selected;
        })
        .on("click", updatePanel)
        .on("mouseenter", function(d) {
          if (!d3.select(this).classed("clicked"))
            d3.select(this).classed("hovered", true);
        })
        .on("mouseleave", function(d) {
          d3.select(this).classed("hovered", false);
        });

      svgPoints.append("circle")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .style('fill', function(d) {
          x = prices_aggregated[d.location_cell];
          if (x) return color_scale(x.difference);
          return "none";
        })
        //.style("stroke", "black")
        .attr("r", 3);
    }

    draw();
    map.on('viewreset moveend', draw); // redraw after zoom/drag

    // add legend
    L.Control.Legend = L.Control.extend({
        onAdd: function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            var prev = d3.min(color_scale.domain()).toFixed(2);
            var values = color_scale.quantiles().concat([d3.max(color_scale.domain())]);
            values = values.map(function(d) { return d.toFixed(2); });

            div.innerHTML = "Average price difference <br>"
            for (var i = 0; i < values.length; i++) {
              div.innerHTML += `<i style="background: ${colors[i]}"></i> \$${prev} to \$${values[i]} <br>`;
              prev = values[i];
            }

            return div;
        },
    });

    L.control.legend = function(opts) {
        return new L.Control.Legend(opts);
    }

    L.control.legend({ position: 'bottomleft' }).addTo(map);

}

// init map
var map = L.map('map');
map.setView([40.731922, -73.965616], 12);

var tiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 18
});
tiles.addTo(map);

prices_aggregated = {}

// load data and draw svg overlay on top of map
queue().defer(d3.csv, "js/location_cell_centers.csv")
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
    last_selected = d.location_cell;

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

    createPriceHist(d.location_cell);
    // d3.csv("js/hotels_aggregated2.csv", function(data) {
    //     data = data.filter(function(curr) {
    //         return d.location_cell == +curr.location_cell;
    //     });
    //     createPriceHist(data);
    // });
}

function createPriceHist(location_cell) {
    d3.select("#prices-hist-svg").remove();

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

    $.ajax({
      url: 'https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/airbnb/_search',
      type: 'POST',
      contentType: 'application/json',
      data: `{
        "_source": ["price"],
        "query": {
          "match": {
            "location_cell": "${location_cell}"
          }
        }
      }`, 
      success: function(data) {
        if (data["hits"] && data["hits"]["total"]) {
          data = data["hits"]["hits"].map(function(d) {
            return d["_source"]["price"];
          });
          
          //console.log(data);

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
      },
      error: function(xhr) {
        console.log(xhr);
      }
  });
}


// function I used for testing plotting hotels
function addHotels(g) {
  // queue().defer(d3.json, "js/clusters2.json")
  //        .defer(d3.csv, "js/clusters2.csv")
  //        .await(function(error, hotels, clusters) {
  //           if (error) throw error;

  //            var points = []
  //            Object.keys(hotels).forEach(function(d) {
  //               coords = hotels[d];
  //               fill = "hsl(" + Math.random() * 360 + ",100%,50%)";
  //               for (var i = 0; i < coords.length; i++) {
  //                   var latlng = new L.LatLng(coords[i][0], coords[i][1]);
  //                   var point = map.latLngToLayerPoint(latlng);
  //                   points.push({x: point.x, y: point.y, color: fill});
  //               }
  //            });

  //           g.selectAll(".hotel-circle")
  //            .data(points)
  //            .enter()
  //            .append("circle")
  //            .attr("class", "hotel-circle")
  //            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
  //            .style('fill', function(d) { return d.color; })
  //            .style('stroke', 'black')
  //            .attr("r", 3);

  //        });

    var clusters = [ 88,  92,  55,  97,  15,  23,   0,  63,  43,   7,  97,  99,  78,
        92,  70, 111,  23,  55,  23,  77,  80, 102,  71,   7, 110, 103,
        69,   3, 104,  84,  51,  56,  52,  15,  51,  55,  98,  55,  15,
        90,  70,  86,  56,  94,  78,  61,  72,  45,  74,  23,  77,  69,
        43,   3,  15,   7, 110,  15,  15,  52,  55,  61, 120,  90,   7,
        62, 119,  61,  45,  90,  17,  51, 128,  83,  70, 120, 103, 115,
       106,  61,  90,  79,  63,  23, 104,  52,  15, 110,  15,  61,  78,
       119, 126,  73,  99,  97, 125,  79, 125, 127,  70,  70,  55, 122,
       103,  90, 112,  92,  78,   7,  94,  70,  86,  34, 104,  92,  38,
       108, 128,  66,  89,  92,  52, 107,  61,  53, 102,  38,  10,  43,
       110,  15, 102,  53,  12, 121, 118,  28,  66,  58, 106,  10,  45,
        58,  73, 126,  73, 116, 102, 117,  58,  10,  58,  27, 105,  27,
        66,  66,  77,  53,  53, 109,  70,  45,  23,  17,  78,   3,  52,
        88, 129,  79,  52,  23,  34,  79,  97,  88, 103,  15,  57,  19,
        87, 100, 113,  20,  31,  95,  48,  11,  68,  60,  85,  21,   8,
        85, 100,   9,  37,  20,  75,  22,  59,  81,  33,  30,  50,  44,
        65,  19, 123,  42,   4,  75,  65,  40,  95, 124,  76,  85, 100,
        41,  91, 114,  64,  60,   6,  75,  39,   2,  39,  46,  25,  33,
       113,   5,  96,  32,  13,  29,  26,  67,  47,  93,  11,  18,  36,
        54,  14,  91,  49,  29,  87,  48,  11, 101,  82,  35,   9,  18,
        24,  16,  20,   1,   6];

    d3.json("js/hotels_coordinates.geojson", function(data) {
      var colors = {};

      data.forEach(function(d, i) {
          var latlng = new L.LatLng(+d.lat, +d.lon);
          var point = map.latLngToLayerPoint(latlng);
          d.x = point.x;
          d.y = point.y;

          var cluster = clusters[i];
          if (!colors.hasOwnProperty(cluster)) {
            colors[cluster] = "hsl(" + Math.random() * 360 + ",100%,50%)";
          }
          d.color = colors[cluster];
      });

        g.selectAll(".hotel-circle")
         .data(data)
         .enter()
         .append("circle")
         .attr("class", "hotel-circle")
         .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
         .attr('style', 'pointer-events:visiblePainted;')
         .attr('fill', function(d) { return d.color; })
         .attr('stroke', 'black')
         .attr("r", 3)
         .on("click", function(d) {
            console.log(d.name);
         });

    });

}
