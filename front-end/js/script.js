$(document).ready(function(){
    // sidebar
    $('.button-collapse').sideNav({
        menuWidth: 450, // Default is 300
        edge: 'right', // Choose the horizontal origin
        closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
        draggable: true // Choose whether you can drag to open on touch screens
    });

    var searchInput = document.getElementById("search");
    searchInput.addEventListener("keypress", searched);
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
                        .limit(80 * map.getZoomScale(map.getZoom(), 13));

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
       .defer(d3.csv, "js/prices_aggregated2.csv")
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

    // hide/show all the appropriate stuff
    document.getElementById("vis").style.display = "";
    document.getElementById("results").style.display = "none";
    document.getElementById("no-results").style.display = "none";

    var diff = prices_aggregated[d.location_cell].difference.toFixed(2);
    if (diff > 0) {
        var priceStr = `Hotel rooms are on average $${diff} more expensive per night than Airbnbs.`;
    } else {
        var priceStr = `Hotel rooms are on average $${(-1 * diff)} less expensive per night than Airbnbs.`;
    }
    document.getElementById("difference-text").textContent = priceStr;

    d3.select(".clicked").classed("clicked", false);
    d3.select(this).classed("clicked", true);

    $.ajax({
        url: 'https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/hotels,airbnb/_search',
        type: 'POST',
        contentType: 'application/json',
        data: `{
            "_source": ["tripadvisor_name", "name", "2017-11-16.rates.price", "2017-11-26.rates.price", "2017-12-06.rates.price", "2017-12-16.rates.price", "2017-12-26.rates.price", "price", "listing_url", "tripadvisor_url", "location.lat", "location.lon", "lat", "lon", "beds", "2017-11-16.room_type_info.number_of_beds", "2017-11-26.room_type_info.number_of_beds", "2017-12-06.room_type_info.number_of_beds", "2017-12-16.room_type_info.number_of_beds", "2017-12-26..room_type_info.number_of_beds"],
            "size": 4000,
            "query": {
              "match": {
                "location_cell": "${d.location_cell}"
              }
            }
          }`, 
        success: function(data) {
            if (data["hits"] && data["hits"]["total"]) {
                var airbnbs = [];
                var hotels = [];
                data["hits"]["hits"].forEach(function(d) {
                    if (d._index == "airbnb") {
                        airbnbs.push(d);
                    } else {
                        hotels.push(d);
                    }
                });

                var listings = airbnbs.map(function(d) { return d["_source"]; });
                var hotel_options = hotels.map(function(d) { return d["_source"]; });
                showAirbnbListings(listings);
                plotPointsWrapper(listings, hotel_options);
                showHotelListings(hotel_options);

                var airbnb_prices = airbnbs.map(function(d) { return +d["_source"]["price"]; });

                var hotel_prices = [];
                var hotel_beds = [];
                var dates = ["2017-11-16", "2017-11-26", "2017-12-06", "2017-12-16", "2017-12-26"];
                dates.forEach(function(date) {
                    hotels.forEach(function(d) {
                        if (d["_source"].hasOwnProperty(date)) {
                            hotel_prices = hotel_prices.concat(d["_source"][date].map(function(h) { 
                                return {
                                    date: date,
                                    price: +h.rates[0].price
                                }    
                            }));
                            hotel_beds = hotel_beds.concat(d["_source"][date].filter(function(h) {
                                return h.room_type_info && h.room_type_info.number_of_beds != "Unspecified";
                            }).map(function(h) {
                                return +h.room_type_info.number_of_beds;
                            }));
                        }
                    });
                });

                // console.log(hotel_beds);

                createHistWrapper(airbnb_prices, hotel_prices);
                createTimeSeries(hotel_prices, d.location_cell);

                if (hotel_beds.length) { 
                    createDonutChart("hotel-rooms", hotel_beds, "Hotels");
                }
                createDonutChart("airbnb-rooms", airbnbs.map(function(d) { return +d["_source"]["beds"]} ), "Airbnb");
                reviewBarChart(d.location_cell);
            }
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });
}

function createHistWrapper(airbnb, hotel) {
    // filter out outliers
    hotel = hotel.map(function(d) { return d.price; });
    hotel = chauvenet(hotel);
    airbnb = chauvenet(airbnb);

    var min = Math.min(d3.min(airbnb), d3.min(hotel));
    var max = Math.max(d3.max(airbnb), d3.max(hotel));
    createPriceHist(hotel, "hotel-hist-svg", min, max, "Hotels");
    createPriceHist(airbnb, "airbnb-hist-svg", min, max, "Airbnbs");
}

function variance(x) {
    var n = x.length;
    if (n < 1) return NaN;
    if (n === 1) return 0;
    var mean = d3.mean(x),
          i = -1,
          s = 0;
    while (++i < n) {
        var v = x[i] - mean;
        s += v * v;
    }
    return s / (n - 1);
};

function chauvenet (x) {
    var dMax = 3;
    var mean = d3.mean(x);
    var stdv = Math.sqrt(variance(x));
    var counter = 0;
    var temp = [];

    for (var i = 0; i < x.length; i++) {
        if(dMax > (Math.abs(x[i] - mean))/stdv) {
            temp[counter] = x[i]; 
            counter = counter + 1;
        }
    };

    return temp
}

function createPriceHist(data, id, xmin, xmax, title) {
    //console.log(data);
    //console.log(data);
    d3.selectAll('#' + id).remove();

    var margin = {
        top: 20,
        left: 10,
        right: 10,
        bottom: 30
    };

    var width = 400 - margin.left - margin.right;
    var height = 170 - margin.top - margin.bottom;

    var svg = d3.select("#prices-hist")
                .append("svg")
                .attr("id", id)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

    var x = d3.scale.linear()
              .domain([xmin, xmax])
              .range([0, width]);

    var hist_data = d3.layout.histogram()
                      .bins(10)
                      (data);

    var yMax = d3.max(hist_data, function(d) { 
        return d.length; 
    });

    var y = d3.scale.linear()
              .domain([0, yMax])
              .range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(8);

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

    g.append("text")
     .text(title)
     .attr("x", (width + margin.left)/2)
     .attr("y", 0 - (margin.top / 2))
     .style("text-anchor", "middle");
}

function showAirbnbListings(listings) {
    var collection = document.getElementById("airbnb-collection"); 

    collection.innerHTML = ""; // remove current html
    for (var i = 0; i < Math.min(listings.length, 10); i++) {
        var a = document.createElement("a");
        a.textContent = listings[i].name;
        a.href = listings[i].listing_url;
        a.className = "collection-item";
        a.setAttribute("target", "_blank");
        collection.appendChild(a);
    }
}

function showHotelListings(hotels) {
    var collection = document.getElementById("hotel-collection");

    collection.innerHTML = "";
    for (var i = 0; i < Math.min(hotels.length, 10); i++) {
        var a = document.createElement("a");
        a.textContent = hotels[i].tripadvisor_name;
        a.href = 'https://www.tripadvisor.com' + hotels[i].tripadvisor_url;
        a.className = "collection-item";
        a.setAttribute("target", "_blank");
        collection.appendChild(a);
    }
}

function plotPointsWrapper(airbnb, hotels) {

  var plotPoints = function() {
    airbnb.forEach(function(d, i) {
        var latlng = new L.LatLng(+d.location.lat, +d.location.lon);
        var point = map.latLngToLayerPoint(latlng);
        d.x = point.x;
        d.y = point.y;
    });

    hotels.forEach(function(d, i) {
        var latlng = new L.LatLng(+d.lat, +d.lon);
        var point = map.latLngToLayerPoint(latlng);
        d.x = point.x; 
        d.y = point.y;
    });

    var g = d3.select("#overlay g");

    g.selectAll(".airbnb-circle").remove();

    g.selectAll(".airbnb-circle")
     .data(airbnb)
     .enter()
     .append("circle")
     .attr("class", "airbnb-circle")
     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
     .attr('fill', "#8e44ad")
     .attr('stroke', 'black')
     .attr("r", 2)
     .style('opacity', .5);

    g.selectAll(".hotel-circle").remove();
    g.selectAll(".hotel-circle")
     .data(hotels)
     .enter()
     .append("circle")
     .attr("class", "hotel-circle")
     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
     .attr('fill', "#D64541")
     .attr('stroke', 'black')
     .style('opacity', .9)
     .attr("r", 4);
    }
    
    plotPoints();
    // map.on('viewreset moveend', plotPoints);
}

function createTimeSeries(data, location_cell) {
    d3.selectAll('#hotel-timeseries').remove();
    var format = d3.time.format("%Y-%m-%d");

    var prices = d3.nest()
               .key(function(d) { return d.date; })
               .rollup(function(v) { return d3.mean(v, function(d) { return d.price; })})
               .entries(data);

    prices.forEach(function(d) {
        d.key = format.parse(d.key);
    })

    var margin = {
        top: 10,
        left: 40,
        right: 10,
        bottom: 30
    };

    var width = 400 - margin.left - margin.right;
    var height = 180 - margin.top - margin.bottom;

    var svg = d3.select("#time")
                .append("svg")
                .attr("id", "hotel-timeseries")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 


    $.ajax({
        url: 'https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/airbnb_prices/_search',
        type: 'POST',
        contentType: 'application/json',
        data:  `
        {
          "size": 4000,
          "query": {
            "match": {
                "location_cell": ${location_cell}
            }
          }
        }
        `,
        success: function(data) {
            if (data["hits"] && data["hits"]["total"]) {
                var by_date = [];
                data = data["hits"]["hits"];
                var options = ["2017-12-06 to 2017-12-07", "2017-12-16 to 2017-12-17", "2017-12-26 to 2017-12-27"];
                data.forEach(function(d) {
                    var dates = options.map(function(o) {
                        return {
                            "date": o.substring(0, 10),
                            "price": d._source[o]
                        };
                    });
                    by_date = by_date.concat(dates);
                });
                console.log(by_date);

                airbnb_prices = d3.nest()
                         .key(function(d) { return d.date; })
                         .rollup(function(v) { return d3.mean(v, function(d) { return d.price; })})
                         .entries(by_date);

                airbnb_prices.forEach(function(d) {
                    d.key = format.parse(d.key);
                });

                var dataset = [
                    {id: "hotel", prices: prices},
                    {id: "airbnb", prices: airbnb_prices}
                ];
                console.log(dataset);

                var all_prices = prices.concat(airbnb_prices);
                console.log(all_prices);

                var x = d3.time.scale().rangeRound([0, width]).domain(d3.extent(all_prices, function(d) { return d.key; }));
                var y = d3.scale.linear().rangeRound([height, 0]).domain([0, d3.max(all_prices, function(d) { return d.values; })]);
                var z = d3.scale.ordinal().range(['steelblue', 'green']).domain(dataset.map(function(d) { return d.id; }));

                var line = d3.svg.line()
                             .x(function(d) { return x(d.key); })
                             .y(function(d) { return y(d.values); });

                var lines = g.selectAll(".timeline")
                             .data(dataset)
                             .enter()
                             .append("g")
                             .attr("class", "timeline");

                lines.append("path")
                     .attr("d", function(d) { console.log(d.prices); return line(d.prices); })
                     .attr("fill", "none")
                     .attr("stroke-width", 2)
                     .attr("stroke", function(d) { return z(d.id); });

                // in case theres only one point in time
                if (prices.length == 1) {
                    g.selectAll(".timeseries-point")
                    .data(prices)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d) { return x(d.key); })
                    .attr("cy", function(d) { return y(d.values); })
                    .attr("fill", "steelblue")
                    .attr("r", 3)
                }

                var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(5);
                var yAxis = d3.svg.axis().scale(y).orient('left');

                g.append("g")
                 .attr("class", "x axis")
                 .attr("transform", "translate(0," + height + ")")
                 .call(xAxis);

                g.append("g")
                 .attr("class", "y axis")
                 .call(yAxis);

            } else {
                plotHotelOnly();
            }
        },
        error: function(xhr) {
            console.log(xhr);
        }
    });


    var plotHotelOnly = function() {
        var x = d3.time.scale().rangeRound([0, width]).domain(d3.extent(prices, function(d) { return d.key; }));
        var y = d3.scale.linear().rangeRound([height, 0]).domain([0, d3.max(prices, function(d) { return d.values; })]);

        var line = d3.svg.line()
                     .x(function(d) { return x(d.key); })
                     .y(function(d) { return y(d.values)});

        //console.log(prices);
        g.append("path")
         .datum(prices)
         .attr("fill", "none")
         .attr("stroke", "steelblue")
         .attr("stroke-width", 2)
         .attr("d", line);

        // in case theres only one point in time
        if (prices.length == 1) {
            g.selectAll(".timeseries-point")
            .data(prices)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d.key); })
            .attr("cy", function(d) { return y(d.values); })
            .attr("fill", "steelblue")
            .attr("r", 3)
        }

        var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(5);
        var yAxis = d3.svg.axis().scale(y).orient('left');

        g.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

        g.append("g")
         .attr("class", "y axis")
         .call(yAxis);
    }

}

function createDonutChart(id, data, title) {
    var total = data.length;
    d3.select("#" + id).remove();

    data = d3.nest()
             .key(function(d) { return d; })
             .rollup(function(v) { return v.length; })
             .entries(data);

    //console.log(data);
    var color = d3.scale.ordinal()
                  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
                  .domain(data.map(function(d) { return d.key; }));

    var radius = 75;
    var svg = d3.select("#rooms")
                .append("svg")
                .attr("id", id)
                .attr("width", radius * 2)
                .attr("height", radius * 2)
                .append("g")
                .attr("transform", "translate(" + radius + "," + radius + ")");

    var arc = d3.svg.arc()
                .outerRadius(radius - 10)
                .innerRadius(radius - 40);

    var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d.values });
    
    var g = svg.selectAll(".arc")
               .data(pie(data))
               .enter()
               .append("g")
               .attr("class", "arc");

    g.append("path")
     .attr("d", arc)
     .style("fill", function(d) {
        return color(d.data.key); 
     });

    svg.append("text")
     .attr("text-anchor", "middle")
     .text(title);

    g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) {
        if (d.data.values/total > .05) {
            return d.data.key;
        }
        return ""; 
      })
      .attr("fill", "white");
}

function searched(e) {
    if (e.keyCode == 13 || e.which == 13) {
        var input = document.getElementById("search");

        if (input.value.length === 0) {
            document.getElementById("vis").style.display = "none";
            document.getElementById("results").style.display = "none";
            document.getElementById("no-results").style.display = "none";
            return;
        }

        $.ajax({
            url: "http://nominatim.openstreetmap.org/search",
            type: "GET",
            data: {
                q: input.value + " New York",
                format: "json"
            },
            success: function(data) {
                if (data.length) {
                    var lat = +data[0].lat;
                    var lon = +data[0].lon;
                    searchLocationElastic(lat, lon);
                } else {
                    noResults();
                }
            },
            error: function(xhr) {
                console.log(xhr);
                noResults();
            }
        });
    }
}

function searchLocationElastic(lat, lon) {
    $.ajax({
        url: 'https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/hotels,airbnb/_search',
        type: 'POST',
        contentType: 'application/json',
        data: `{
              "query": {
                "bool": {
                  "must": {
                    "match_all": {}
                  },
                  "filter": {
                    "geo_distance": {
                      "distance": "1km",
                      "location": {
                        "lat": ${lat},
                        "lon": ${lon}
                      }
                    }
                  }
                }
              },
              "sort": [
                {
                  "_geo_distance": {
                    "location": {
                      "lat": ${lat},
                      "lon": ${lon}
                    },
                    "order": "asc",
                    "unit": "km",
                    "distance_type": "plane"
                  }
                }
              ]
            }`,
        success: function(data) {
            if (data["hits"] && data["hits"]["total"]) {
                showResults(data["hits"]["hits"]);
            } else {
                noResults();
            }
        },
        error: function(xhr) {
            console.log(xhr);
            noResults();
        }
    });
}

function showResults(data) {    
    var collection = document.getElementById("results");
    collection.style.display = "";
    document.getElementById("vis").style.display = "none";
    document.getElementById("no-results").style.display = "none";

    collection.innerHTML = "";

    var hotel_points = [];
    var airbnb_points = [];

    for (var i = 0; i < data.length; i++) {
        var li = document.createElement("li");
        li.className = "collection-item avatar";

        var name, url, price;
        if (data[i]._index == "airbnb") {
            var source = data[i]._source;
            name = source.name;
            url = source.listing_url;
            price = source.price;

            var img = document.createElement("img");
            img.src = "js/airbnb_logo.png";
            img.className = "circle";
            li.appendChild(img);

            airbnb_points.push({
                location: {
                    lat: source.location.lat,
                    lon: source.location.lon
                }
            });
        } else {
            var source = data[i]._source;
            name = source.tripadvisor_name;
            url = 'https://www.tripadvisor.com' + source.tripadvisor_url;

            var prices = [];
            var dates = ["2017-11-16", "2017-11-26", "2017-12-06", "2017-12-16", "2017-12-26"];
            dates.forEach(function(date) {
                if (source.hasOwnProperty(date)) {
                    prices = prices.concat(source[date].map(function(h) {
                        return +h.rates[0].price;
                    }));
                }
            });
            price = d3.mean(prices);

            var icon = document.createElement("i");
            icon.className = "material-icons circle";
            icon.textContent = "hotel";
            li.appendChild(icon);

            hotel_points.push({
                'lat': source.lat,
                'lon': source.lon
            });
        }
        var span = document.createElement("span");
        span.className = "title";

        var a = document.createElement("a");
        a.href = url;
        a.textContent = name;
        a.setAttribute("target", "_blank");
        span.appendChild(a);
        li.appendChild(span);

        var p = document.createElement("p");
        p.textContent = `\$${Math.round(price)}`;
        li.appendChild(p);

        collection.appendChild(li);
    }

    plotPointsWrapper(airbnb_points, hotel_points);
}

function noResults() {
    document.getElementById("no-results").style.display = "";
}

function reviewBarChart(location_cell) {
    d3.select("#reviews-svg").remove();

    var margin = {
        top: 10,
        left: 90,
        right: 10,
        bottom: 30
    };

    var width = 400 - margin.left - margin.right;
    var height = 180 - margin.top - margin.bottom;

    var svg = d3.select("#reviews")
                .append("svg")
                .attr("id", "reviews-svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    var g = svg.append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");  

    var x = d3.scale.linear().range([0, width]);
    var y0 = d3.scale.ordinal().rangeRoundBands([height, 0], .1);
    var y1 = d3.scale.ordinal();

    var color = d3.scale.ordinal()
                  .range(["#98abc5", "#8a89a6", "#7b6888"])
                  .domain(["hotel", "airbnb"]);

    queue().defer(d3.csv, "js/hotel_sentiments.csv")
           .defer(d3.csv, "js/air_sentiments.csv")
           .await(function(error, hotel, airbnb) {

            hotel = hotel.filter(function(d) {
                return location_cell == d.location_tag;
            });
            if (!hotel.length) {
                return;
            } 
            airbnb = airbnb.filter(function(d) {
                return location_cell == d.location_tag;
            });
            if (!airbnb.length) {
                return;
            }

            hotel = hotel[0];
            airbnb = airbnb[0];
            var dataset = [
               {label: "location", hotel: +hotel.location, airbnb: +airbnb.location},
               {label: "hospitality", hotel: +hotel.hospitality, airbnb: +airbnb.hospitality},
               {label: "room_quality", hotel: +hotel.room_quality, airbnb: +airbnb.room_quality} 
            ]

            var options = ["hotel", "airbnb"];
            dataset.forEach(function(d) {
                d.values = options.map(function(name) { return {name: name, value: +d[name]}; });
            });

            y0.domain(dataset.map(function(d) { return d.label; }));
            y1.domain(options).rangeRoundBands([0, y0.rangeBand() ]);
            x.domain([-1, d3.max(dataset, function(d) { return d3.max(d.values, function(x) { return x.value; })})]);

            var bars = g.selectAll(".bar")
                       .data(dataset)
                       .enter()
                       .append("g")
                       .attr("class", "bar")
                       .attr("transform", function(d) { return "translate(0," + y0(d.label) + ")"; });

            var bar2 = bars.selectAll("rect")
                           .data(function(d) { return d.values; })
                           .enter()
                           .append("rect")
                           .attr("height", y1.rangeBand())
                           .attr("y", function(d) { return y1(d.name); })
                           .attr("x", 0)
                           .attr("width", function(d) { return x(d.value); })
                           .attr("value", function(d) { return d.name; })
                           .style("fill", function(d) { return color(d.name); });

            var yAxis = d3.svg.axis().scale(y0).orient('left');
            g.append("g")
             .attr("class", "y axis")
             .call(yAxis);

            var xAxis = d3.svg.axis().scale(x).orient('bottom');
            g.append("g")
             .attr("class", "y axis")
             .attr("transform", "translate(0," + height + ")")
             .call(xAxis);
    });
}