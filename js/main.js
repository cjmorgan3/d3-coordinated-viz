//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 700,
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
        .defer(d3.csv, "data/CanadianNaturalResources.csv") //load attributes from csv
        .defer(d3.json, "data/canadian_provinces_territories.topojson") //load background spatial data
        .await(callback);

    function callback(error, csvData, canada){
        //translate canada TopoJSON
        var canadianProvinces = topojson.feature(canada, canada.objects.canadian_provinces_territories).features;
        
        //examine the results
        console.log(canadianProvinces);

        // //variables for data join
        // var attrArray = ["Province/Territory Copper (t/sq km)", "Gold (kg/sq km)", "Timber (m^3/sq km)", "Natural Gas (K m^3/sq km)", "Freshwater (% surface area)"];

        // //loop through csv to assign each set of csv attribute values to geojson region
        // for (var i=0; i<csvData.length; i++){
        //     var csvRegion = csvData[i]; //the current region
        //     var csvKey = csvRegion.ID; //the CSV primary key

        //     //loop through geojson regions to find correct region
        //     for (var a=0; a<canadianProvinces.length; a++){

        //         var geojsonProps = canadianProvinces[a].properties; //the current region geojson properties
        //         var geojsonKey = geojsonProps.ID; //the geojson primary key

        //         //where primary keys match, transfer csv data to geojson properties object
        //         if (geojsonKey == csvKey){

        //             //assign all attributes and values
        //             attrArray.forEach(function(attr){
        //                 var val = parseFloat(csvRegion[attr]); //get csv attribute value
        //                 geojsonProps[attr] = val; //assign attribute and value to geojson properties
        //             });
        //         };
        //     };
        // };

        //add Canadian Provinces to map
        var provinces = map.selectAll(".provinces")
            .data(canadianProvinces)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "provinces " + d.properties.ID;
            })
            .attr("d", path);
    };
};