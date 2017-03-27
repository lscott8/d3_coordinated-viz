
//begin script when window loads
window.onload = setMap();


function setMap(){


    //map frame dimensions
    var width = 700,
        height = 800;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Wisconsin
    var projection = d3.geoAlbers()
        .center([0, 44.5])
        .rotate([90, 0, 0])
        .parallels([25, 60])
        .scale(8000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

      d3.queue()
          .defer(d3.csv, "data/d3_data_scott.csv") //load attributes from csv
          .defer(d3.json, "data/WI_counties.topojson") //load choropleth spatial data
          .await(callback);


function callback(error, csvData, wisconsin){

      var wiCounties = topojson.feature(wisconsin, wisconsin.objects.WI_counties).features;

      console.log(map)
      var counties = map.selectAll("path")
      .data(wiCounties)
          .enter()
          .append("path")
          .attr("class", function(d){
            console.log(this)
              return "counties " + d.properties.name;
          })
          .attr("d", path);
          console.log(wiCounties)

      };
    };
