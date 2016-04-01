//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Copper", "Gold", "Timber", "Natural Gas", "Freshwater"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

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
        "#fee5d9",
        "#fcae91",
        "#fb6a4a",
        "#de2d26",
        "#a50f15"
    ];

    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
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
        chartHeight = 560;

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a scale to size bars proportionally to frame
    var yScale = d3.scale.linear()
        .range([0, chartHeight])
        .domain([0, 105]);

    //set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .attr("class", function(d){
            return "bars " + d.ID;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
};

})(); //last line of main.js