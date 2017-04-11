var attrArray = ["Median Income in Thousands", "Percentage of Badgercare Recipients", "Percentage of Foodshare Recipients", "Foodshare per Recipient ", "Percent below Poverty Level"];
var expressed = attrArray[0];
var chartWidth = window.innerWidth * 0.45,
    chartHeight = 475,
    leftPadding = 30,
    rightPadding = 10,
    topBottomPadding = 10,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
var yScale = d3.scaleLinear()
    .range([475, 0])
    .domain([0, 65]);
document.body.style.backgroundColor = "black";
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
        var colorScale = makeColorScale(csvData);
        setEnumerationUnits(wiCounties, map, path, colorScale);
        setChart(csvData, colorScale);
        createDropdown(csvData);
        // addLegend(csvData, colorScale);
        };


    function joinData(wiCounties, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region

            var csvKey = csvRegion.Name; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<wiCounties.length; a++){
                var geojsonProps = wiCounties[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.Name; //the geojson primary key

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
                return "counties " + d.properties.Name.replace(/ /g, "_");
            })
            .attr("d", path)
            .style('fill', function(d){
                return choropleth(d.properties, colorScale);
            })
            .on('mouseover', function(d){
                highlight(d.properties)
            })
            .on('mouseout', function(d){
                dehighlight(d.properties)
            })
            .on('mousemove', moveLabel);


        var desc = counties.append("desc")
            .text('{"stroke": "#ccc", "stroke-width": "0px"}');

      };


    function makeColorScale(csvData){
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
        //trying to make the axis dynamic
        var yScale = d3.scaleLinear()
            .range([475, 0])
            .domain([d3.min(csvData[i][expressed]) ,d3.max(csvData[i][expressed]) + 5])
          };
          // updateChart(bars, csvData.length, colorScale);
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

        //set bars for each province
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bar " + d.Name.replace(/ /g, "_");
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d, i){
                return 455 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .on('mouseover', highlight)
            .on('mouseout', dehighlight)
            .on('mousemove', moveLabel)
            .style("fill", function(d){
                return choropleth(d, colorScale);
              });

        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Median Income in Thousands in Wisconsin Counties");

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

    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on('change', function(){

        changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
      };

    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;
        //recreate the color scale
        var colorScale = makeColorScale(csvData);
        //recolor enumeration units
        var counties = d3.selectAll(".counties")
            .transition()
            .duration(500)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            });

            //re-sort, resize, and recolor bars
      var bars = d3.selectAll(".bar")
          //re-sort bars
          .sort(function(a, b){
              return b[expressed] - a[expressed];
          })
          .transition()
          .delay(function(d, i){
              return i * 20
           })
          .duration(200);

      updateChart(bars, csvData.length, colorScale);
    };

    function updateChart(bars, n, colorScale){
        //position bars
        bars.attr('x', function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        .attr('height', function(d, i){
            return 455 - yScale(parseFloat(d[expressed]));
        })
        .attr('y', function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
        var chartTitle = d3.select(".chartTitle")
            .text(expressed + " in Wisconsin Counties");
        };

    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.Name.replace(/ /g, '_'))
            .style("stroke", "red")
            .style("stroke-width", "3");

        setLabel(props);
};

    function dehighlight(props){
        d3.select(".infolabel")
            .remove();

        var selected = d3.selectAll("." + props.Name.replace(/ /g, '_'))
            .style("stroke", function(){
                return getStyle(this, "stroke");
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width");
            });
    };

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        var styleObject = JSON.parse(styleText);
            return styleObject[styleName];
      };

    function setLabel(props){
        //label content
        var labelAttribute = "<h1>" + props[expressed] +
            "</h1><b>" + expressed + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.Name.replace(/ /g, "_") + "_label")
            .html(labelAttribute);

        var countiesName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.Name);
      };

    //use coordinates of mousemove event to set label coordinates
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    // function addLegend(csvData, colorScale){
    //   var legend = d3.selectAll('g.legend')
    //     .data(csvData)
    //     .enter()
    //     .append('g')
    //     .attr('class', 'legend')
    //
    // var legendWidth = 30;
    // var legendHeight = 30;
    //
    // legend.append('rect')
    //   .attr('x', 20)
    //   .attr('y', function(d, i){
    //     return choropleth(d.properties, colorScale)
    //   })
    //   .attr('width', legendWidth)
    //   .attr('height', legendHeight)
    //
    // }
    }
