window.onload = function(){

  var container = d3.select('body')
    .append('svg')
    .attr('width', '980px')
    .attr('height', '500px')
    .attr('class', 'container')
    .style("background-color", "rgba(0,0,0,0.2)");

  var innerRect = container.append('rect')
  .datum(400)
  .attr('width', function(d){
    return d * 2 + 75;
  }) //rectangle width
  .attr('height', function(d){
    return d;
  }) //rectangle height

  .attr("class", "innerRect") //class name
  .attr("x", 50) //position from left on the x (horizontal) axis
  .attr("y", 50) //position from top on the y (vertical) axis
  .style("fill", "#b19cd9"); //fill color

var cityPop = [
        {
            city: 'Atlanta',
            population: 447841
        },
        {
            city: 'Savannah',
            population: 142772
        },
        {
            city: 'Macon',
            population: 89981
        },
        {
            city: 'Agusta',
            population: 197872
        }
    ];

var x = d3.scaleLinear() //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]);

var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

var y = d3.scaleLinear()
        .range([450, 50])
        .domain([0, 550000]);

var color = d3.scaleLinear()
      .range([
          "#b2dfee",
          "#003f87"
        ])
      .domain([
          minPop,
          maxPop
            ]);

var circles = container.selectAll(".circles") //but wait--there are no circles yet!
       .data(cityPop) //here we feed in an array
       .enter()
       .append("circle") //add a circle for each datum
       .attr("class", "circles")
       .attr("id", function(d){
            return d.city;
        })
       .attr("r", function(d){
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
       .attr("cx", function(d, i){
            //use the index to place each circle horizontally
            return x(i);
        })
      .attr("cy", function(d){
            //subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
            return y(d.population);
        })
      .style("fill", function(d, i){ //add a fill based on the color scale generator
            return color(d.population);
        })
      .style("stroke", "#000");

var yAxis = d3.axisLeft(y);
var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis);

var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");

var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("x", function(d,i){
        //horizontal position to the right of each circle
              return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
      })
        .attr("y", function(d){
              //vertical position centered on each circle
              return y(d.population) + 5;
          });

var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
              //horizontal position to the right of each circle
              return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
      })
        .text(function(d){
              return d.city;
      });
var format = d3.format(",");

var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .attr("dy", "15") //vertical offset
        .text(function(d){
            return "Pop. " + format(d.population); //use format generator to format numbers
        });
}
