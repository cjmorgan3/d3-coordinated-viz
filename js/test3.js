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

//...the rest of the script