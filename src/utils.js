//Utils
"use strict";

//Convert array into string for gui handling
//number array only
export var g_arrayToFloatList = function( array ){
    var str = ""
    for( var val of array )
        str += val.toString() + " "
    return str.trim(); //remove final space
}
//Conver a string thats a space-separated list of floats, to an array of floats
//e.g. s = "1 2 3.5"
export var g_floatListToArray = function( floatListString ){
    //trim possible white space at end of string
    floatListString = floatListString.trim();
    var astr = floatListString.split(" ");
    var af = [];
    for( var i in astr )
        af[i] = parseFloat(astr[i]);
    return af;
}
