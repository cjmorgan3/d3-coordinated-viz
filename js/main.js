//Top of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Copper", "Gold", "Timber", "Natural Gas", "Freshwater"]; //list of attributes
var expressed = attrArray[4]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 570,
    leftPadding = 35,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scale.linear()
    .range([560, 0])
    .domain([0, 18]);

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

        //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 560;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Canada
    var projection = d3.geo.albers()
        .center([12.09, 62.69])
        .rotate([101.00, 0, 0])
        .parallels([39.05, 74.06])
        .scale(750)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.csv, "data/canNatRes.csv") //load attributes from csv
        .defer(d3.json, "data/canadian_provinces_territories.topojson") //load background spatial data
        .await(callback);

    //...MAP, PROJECTION, PATH, AND QUEUE BLOCKS FROM MODULE 8

    function callback(error, csvData, canada){

        //translate canada TopoJSON
        var canadianProvinces = topojson.feature(canada, canada.objects.canadian_provinces_territories).features;
        
        //examine the results
        console.log(canadianProvinces);
        console.log(csvData);

        //join csv data to GeoJSON enumeration units
        canadianProvinces = joinData(canadianProvinces, csvData);

        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(canadianProvinces, map, path, colorScale);

        //add coordinated visualization to the map
        setChart(csvData, colorScale);

        //function to create a dropdown menu for attribute selection
        createDropdown(csvData)

        changeAttribute(attribute, csvData)
    };
}; //end of setMap()

function joinData(canadianProvinces, csvData){
        //variables for data join
        var attrArray = ["Copper", "Gold", "Timber", "Natural Gas", "Freshwater"];

        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.ID; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<canadianProvinces.length; a++){

                var geojsonProps = canadianProvinces[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.ID; //the geojson primary key

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

    return canadianProvinces;
};

function setEnumerationUnits(canadianProvinces, map, path, colorScale){
    //add Canadian Provinces to map
    var provinces = map.selectAll(".provinces")
        .data(canadianProvinces)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "provinces " + d.properties.ID;
        })
        .attr("d", path)
        .style("fill", function(d){
            return colorScale(d.properties[expressed]);
        });
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#eff3ff",
        "#bdd7e7",
        "#6baed6",
        "#3182bd",
        "#08519c"
    ];

    //create color scale generator
    var colorScale = d3.scale.threshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
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

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (val && val != NaN){
        return colorScale(val);
    } else {
        return "#FFF";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 570,
        leftPadding = 35,
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
    var yScale = d3.scale.linear()
        .range([560, 0])
        .domain([0, 18]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1);

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 60)
        .attr("y", 40)
        .attr("class", "chartTitle");

    var chartSubtitle = chart.append("text")
        .attr("x", 260)
        .attr("y", 70)
        .attr("class", "chartSubtitle")
        .text("Normalized as percent of surface area");

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

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

    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
}; //end of setChart()

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
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
    var regions = d3.selectAll(".provinces")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return a[expressed] - b[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);
}; //end of changeAttribute()

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 560 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

     var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each Province or Territory");   
};

})(); //last line of main.js