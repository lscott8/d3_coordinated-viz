var attrArray = ["median_income", "pct_badgercare", "pct_foodshare", "foodshare_per_recipient", "pct_pov_level"];
var expressed = attrArray[0];
//begin script when window loads
window.onload = setMap();

    function setMap(){


        //map frame dimensions
        var width = window.innerWidth * 0.50,
            height = 760;

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
          //variables for data join

          wiCounties = joinData(wiCounties, csvData);

          //setEnumerationUnits(wiCounties, map, path, colorScale);


          var colorScale = makecolorScale(csvData);
          setEnumerationUnits(wiCounties, map, path, colorScale);
          choropleth
          setChart(csvData, colorScale);
        };


      function joinData(wiCounties, csvData){
          //loop through csv to assign each set of csv attribute values to geojson region
          for (var i=0; i<csvData.length; i++){
              var csvRegion = csvData[i]; //the current region

              var csvKey = csvRegion.adm1_code; //the CSV primary key

              //loop through geojson regions to find correct region
              for (var a=0; a<wiCounties.length; a++){

                  var geojsonProps = wiCounties[a].properties; //the current region geojson properties

                  var geojsonKey = geojsonProps.GEOID; //the geojson primary key

                  //where primary keys match, transfer csv data to geojson properties object
                  if (geojsonKey == csvKey){

                      //assign all attributes and values
                      attrArray.forEach(function(attr){
                          var val = parseFloat(csvRegion[attr]); //get csv attribute value
                          geojsonProps[attr] = val; //assign attribute and value to geojson properties
                      });
                  };
              };
          };
          return wiCounties;
          };

      function setEnumerationUnits(wiCounties, map, path, colorScale){

          var counties = map.selectAll(".counties")
          .data(wiCounties)
              .enter()
              .append("path")
              .attr("class", function(d){
                  return "counties " + d.properties.GEOID;
              })
              .attr("d", path)
              .style('fill', function(d){
                 return colorScale(d.properties[expressed]);
              });
        };


      function makecolorScale(csvData){
          var colorClasses = [
            "#f1eef6",
            "#bdc9e1",
            "#74a9cf",
            "#2b8cbe",
            "#045a8d"
        ];

        //create color scale generator
          var colorScale = d3.scaleThreshold()
                .range(colorClasses);


                //build array of all values of the expressed attribute
          var domainArray = [];
            for (var i=0; i<csvData.length; i++){
                var val = parseFloat(csvData[i][expressed]);
                domainArray.push(val);
          };
          //cluster data using ckmeans clustering algorithm to create natural breaks
          var clusters = ss.ckmeans(domainArray, 5);
          //reset domain array to cluster minimums
          domainArray = clusters.map(function(d){
              return d3.min(d);
          });
          //remove first value from domain array to create class breakpoints
          domainArray.shift();

          //assign array of last 4 cluster minimums as domain
          colorScale.domain(domainArray);

          return colorScale;
        };

      function choropleth(props, colorScale){
          //make sure attribute value is a number
          var val = parseFloat(props[expressed]);
          //if attribute value exists, assign a color; otherwise assign gray
          if (typeof val == 'number' && !isNaN(val)){
              return colorScale(val);
          } else {
              return "#CCC";
          };
      };

      //function to create coordinated bar chart
      function setChart(csvData, colorScale){
          //chart frame dimensions
          var chartWidth = window.innerWidth * 0.45,
              chartHeight = 475,
              leftPadding = 25,
              rightPadding = 2,
              topBottomPadding = 5,
              chartInnerWidth = chartWidth - leftPadding - rightPadding,
              chartInnerHeight = chartHeight - topBottomPadding * 2,
              translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

          //create a second svg element to hold the bar chart
          var chart = d3.select("body")
              .append("svg")
              .attr("width", chartWidth)
              .attr("height", chartHeight)
              .attr("class", "chart");

          //create a rectangle for chart background fill
          var chartBackground = chart.append("rect")
              .attr("class", "chartBackground")
              .attr("width", chartInnerWidth)
              .attr("height", chartInnerHeight)
              .attr("transform", translate);

          //create a scale to size bars proportionally to frame and for axis
          var yScale = d3.scaleLinear()
              .range([460, 0])
              .domain([0, 45]);

          //set bars for each province
          var bars = chart.selectAll(".bar")
              .data(csvData)
              .enter()
              .append("rect")
              .sort(function(a, b){
                  return b[expressed]-a[expressed]
              })
              .attr("class", function(d){
                  return "bar " + d.adm1_code;
              })
              .attr("width", chartInnerWidth / csvData.length - 1)
              .attr("x", function(d, i){
                  return i * (chartInnerWidth / csvData.length) + leftPadding;
              })
              .attr("height", function(d, i){
                  return 463 - yScale(parseFloat(d[expressed]));
              })
              .attr("y", function(d, i){
                  return yScale(parseFloat(d[expressed])) + topBottomPadding;
              })
              .style("fill", function(d){
                  return choropleth(d, colorScale);
              });

          //create a text element for the chart title
          var chartTitle = chart.append("text")
              .attr("x", 40)
              .attr("y", 40)
              .attr("class", "chartTitle")
              .text("Median Income in Wisconsin Counties in Thousands");

          //create vertical axis generator
          var yAxis = d3.axisLeft()
              .scale(yScale);

          //place axis
          var axis = chart.append("g")
              .attr("class", "axis")
              .attr("transform", translate)
              .call(yAxis);

          //create frame for chart border
          var chartFrame = chart.append("rect")
              .attr("class", "chartFrame")
              .attr("width", chartInnerWidth)
              .attr("height", chartInnerHeight)
              .attr("transform", translate);
      };
    }


    // ;document.setEventListener('resize', function(){
    //
    // })
