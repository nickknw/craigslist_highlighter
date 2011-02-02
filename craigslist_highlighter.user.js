// ==UserScript==
// @name           Craigslist highlighting
// @namespace      nickknw.nearlyfreespeech.net
// @include        http://*.en.craigslist.ca/search/apa*
// @include        http://*.en.craigslist.ca/apa*
// @require	   http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// ==/UserScript==


/**************************
* set up user-specific data
**************************/

var MaxPrice = 875;

var animalGoodPhrases = new Array("% negotiable", "% considered", "% permitted", "% ok", "%s ok", "%s are OK - purrr", "maybe a %", "%s are OK - wooof");
var animalBadPhrases = new Array("no %", "no %s", "%s not permitted", "no %s permitted");

var petGoodPhrases = replaceInArray(animalGoodPhrases, "pet");
var petBadPhrases = replaceInArray(animalBadPhrases, "pet")

var catGoodPhrases = array.concat(replaceInArray(animalGoodPhrases, "cat"), petGoodPhrases);
var catBadPhrases = array.concat(replaceInArray(animalBadPhrases, "cat"), petBadPhrases);

var dogGoodPhrases = array.concat(replaceInArray(animalGoodPhrases, "dog"), petGoodPhrases);
var dogBadPhrases = array.concat(replaceInArray(animalBadPhrases, "dog"), petBadPhrases);

var goodLocations = new Array("Oak Bay", "Fairfield", "Gordon\\s\*Head", "Camosun", "Oaklands", "Beacon Hill", "Interurban");
var badLocations = new Array("Esquimalt", "Langford", "Lake Cowichan", "Sooke", "Brentwood Bay", "\\w\+ Island", "Parksville");

var goodPhrases = new Array("dishwasher", "balcony", "fireplace",  "Hillside Mall", "2br", "2 bedroom", "two bedroom" );
var badPhrases = new Array("no balcony", "no dishwasher", "share a kitchen",, );

var times_available = new Array("January", "Jan", "February", "Feb", "March", "Mar", "April", "Apr", "June", "Jun", "July", "Jul", "August", "Aug", "September", "Sept", "October", "Oct", "November", "Nov", "December", "Dec", "immediately");

//make sure words like 'deck' aren't highlighted
times_available = $.map(times_available, function(monthName) { return (" " + monthName + "[. ]"); });


/****************
* main function
****************/

$(document).ready(function() {

    craigslist_highlighter_is_on = GM_getValue('is_highlighting_on', true)
    if(!craigslist_highlighter_is_on) {
        $("#searchtable > tbody").append(onOffSwitch());
        return;
    }

    loadUserData();

    // attach listener that saves data to Search button 

    // Insert extra controls
    //$("#searchfieldset").after(highlightFieldset());
    $("#searchtable > tbody").append(preferredLocationsControl());
    $("#searchtable > tbody").append(preferredPhrasesControl());
    $("#searchtable > tbody").append(preferredFeaturesCheckboxes());
    $("#searchtable > tbody").append(onOffSwitch());

    // fill controls with data


    processListingsPage();

    processIndividualPage();
});


/*******************************************
* helper functions
*******************************************/

function loadUserData() {
    // I normally dislike globals, but this is a pretty small script and these are 
    // only ever modified in one place, so I think I will be able to live with myself ;)
    //goodLocations
    //badLocations
    //goodPhrases
    //badPhrases
}

// heavy lifting function; does most of the work of this script
function processListingsPage() {

    // For each listing on the listings page
    $("blockquote > p").each(function() {
        var listing = $(this);
        var text = new Object();
        text.value = listing.html();

        //is this listing in our price range?
	var price = extractPrice(text.value);
        if (price > MaxPrice) {
            return;
        }

        //follows the listing link and retrieves the 'full listing' web page
        var link = listing.children("a").attr("href");  
        if(link == null) {
            return;
        }

        $.get(link, function(data, textStatus) {

            //list of words found in the full listing page
            var details = " <font size='-1'> <strong> ";         

            //regex that will find the userbody tag + contents
            var regex = /<div id="userbody">([\s\S]*)<.div>/gi;  

            //IMPORTANT: without this, the regex will fail every second 
            //time it executes because it is saving position
            regex.lastIndex = 0;                                 

            //extract the 'userbody' tag + contents
            var userbody = regex.exec(data)[0];                  

            //find and extract desired words from userbody, and wrap them in the appropriate colours
            var termsFound = "";
            termsFound += extractWords(userbody, goodLocations, "#69EF68");
            termsFound += extractWords(userbody, goodPhrases, "#69EF68");
            termsFound += extractWords(userbody, badLocations, "#EFB3B3");
            termsFound += extractWords(userbody, badPhrases, "#EFB3B3");
            termsFound += extractWords(userbody, times_available, "#BBBBFF");
            if(termsFound != "") { termsFound = "Terms Found: " + termsFound; }

            details += termsFound;
            details += "</strong></font>";

            //add the desired listing details to the listings page
            listing.append(details);      

            //get the updated listing text
            text.value = listing.html();  

            //give the listing the correct background colour based on location
            if(highlightWords(text, goodLocations, "#69EF68")) {
                listing.css("background-color", "#AAFFAA");
            }
            if(highlightWords(text, badLocations, "#EFB3B3")) {
                listing.css("background-color", "#FFDDDD");
            }
            
            var price = extractPrice(text.value);
            
            color = price - 675;

            color = color / 22;
            color = Math.floor(color);
            
            if(color < 0) { color = 0; }
            if(color > 9) { color = 9; }

            colorInHex = "#" + color + color + color + color + color + color;

            //console.log(colorInHex);
            highlightDollarAmount(text, price, colorInHex);

            listing.html(text.value);    //save the new listing text back into the listing

        }, "html");
    });
}

function processIndividualPage() {
    //in the body of text and the title on each individual page
    $("#userbody, h2").each(function() {
        var text = new Object();
        text.value = $(this).html();

        highlightWords(text, goodPhrases, "#AAFFAA");
        highlightWords(text, goodLocations, "#AAFFAA");
        highlightWords(text, badPhrases, "#FFAAAA");
        highlightWords(text, badLocations, "#FFAAAA");
        highlightWords(text, times_available, "#BBBBFF");

        $(this).html(text.value);
    });
}

// IN-PLACE highlighting of WORDS in a body of TEXT with the specified COLOR
// returns true if anything was changed
function highlightWords(text, words, color) {

    changed = false;
    for (i in words) {

        var regex = new RegExp("("+words[i]+")", "gi");
        text.value = text.value.replace(regex, " <span style='background-color: " + color + "'>$1</span> ");

        if(!changed && regex.test(text.value)) {
            changed = true;
        }
    }
    return changed;
}

function highlightDollarAmount(text, price, color) {
    var regex = new RegExp("(\\$"+price+")", "gi");
    text.value = text.value.replace(regex, " <span style='color: " + color + "'>$1</span> ");
}

// extracts the specified WORDS from the body of TEXT, highlights them with the specified COLOR, and wraps them in brackets
function extractWords(text, words, color) {

    var listOfWords = "";

    for(i in words) {

        var regex = new RegExp("("+words[i]+")", "gi");
	// regex.lastIndex = 0;
        var regexSuccess = regex.exec(text);
        if(regexSuccess != null) {
            listOfWords += " (<span style='background-color: " + color + "'>" + regexSuccess[0] + "</span>) ";
        }
    }
    return listOfWords;
}

//determines if listing is in in acceptable price range (under $1300)
function inPriceRange(text) {
    return /\$[0-8][0-9][0-9]\s/.test(text);
}

// only looks for numbers and accounts for a possible $ 
function extractPrice(text) {

    var price = 0;
    var regexSuccess = /\$\s?\d+/.exec(text);

    if (regexSuccess != null) {
	price = parseInt(regexSuccess[0].substring(1));
    }

    return price;
}

function preferredLocationsControl() {
    return "<tr>" +
        "<td width='1' align='right'>good locations:</td>" +
        "<td colspan='3' style='padding:0px'>" + 
            "<table width='100%'><tbody><tr>" +
            "<td><input class='goodLocations dv' value='' style='width:100%'></td>" +
            "<td width='140' align='right'>bad locations:</td>" +
            "<td><input class='badLocations dv' value='' style='width:100%'></td>" +
            "</tr></tbody></table>" +
        "</td>" +

        "<script type='text/javascript'>$('input.goodLocations').DefaultValue('comma separated list');</script>" +
        "<script type='text/javascript'>$('input.badLocations').DefaultValue('comma separated list');</script>" +
        "</tr>";
}

function preferredPhrasesControl() {
    return "<tr>" +
        "<td width='1' align='right'>desirable phrases:</td>" +
        "<td colspan='3' style='padding:0px'>" + 
            "<table width='100%'><tbody><tr>" +
            "<td><input class='goodPhrases dv' value='' style='width:100%'></td>" +
            "<td width='140' align='right'>undesirable phrases:</td>" +
            "<td><input class='badPhrases dv' value='' style='width:100%'></td>" +
            "</tr></tbody></table>" +
        "</td>" +

        "<script type='text/javascript'>$('input.goodPhrases').DefaultValue('comma separated list');</script>" +
        "<script type='text/javascript'>$('input.badPhrases').DefaultValue('comma separated list');</script>" +
        "</tr>";
}

function preferredFeaturesCheckboxes() {
    return "<tr>" +
        "<td width='1' align='right'>features:</td>" +
        "<td>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='fireplace' name='chkFireplace'>fireplace</label>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='balcony' name='chkBalcony'>balcony</label>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='dishwasher' name='chkDishwasher'>dishwasher</label>" + 
        "</td>" +
        "</tr>";
}

function onOffSwitch() {
    return "<tr>" +
        "<td width='1' align='right'>craigslist highlighter:</td>" +
        "<td><select><option value='on'>On</option><option value='off'>Off</option></select></td>" +
        "</tr";
}

function replaceInArray(array, word_to_insert) {
    return $.map(array, function(phrase) { phrase.replace(/%/g, word_to_insert) });
}
