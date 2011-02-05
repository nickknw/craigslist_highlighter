// ==UserScript==
// @name           Craigslist highlighting
// @namespace      https://github.com/nickknw
// @include        http://*.en.craigslist.ca/search/apa*
// @include        http://*.en.craigslist.ca/apa*
// @require	   http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// ==/UserScript==

// Pre-calculated Phrases {{{

var MaxPrice = 875;

var animalGoodPhrases = new Array("% negotiable", "% considered", "% permitted", "% ok", "%s ok", "%s are OK - purrr", "maybe a %", "%s are OK - wooof");
var animalBadPhrases = new Array("no %", "no %s", "%s not permitted", "no %s permitted");

var petGoodPhrases = replaceInArray(animalGoodPhrases, "pet");
var petBadPhrases = replaceInArray(animalBadPhrases, "pet")

var catGoodPhrases = Array.concat(replaceInArray(animalGoodPhrases, "cat"), petGoodPhrases);
var catBadPhrases = Array.concat(replaceInArray(animalBadPhrases, "cat"), petBadPhrases);

var dogGoodPhrases = Array.concat(replaceInArray(animalGoodPhrases, "dog"), petGoodPhrases);
var dogBadPhrases = Array.concat(replaceInArray(animalBadPhrases, "dog"), petBadPhrases);

var dishwasherGood = new Array("dishwasher");
var dishwasherBad = new Array("no dishwasher");

var fireplaceGood = new Array("fireplace");
var fireplaceBad = new Array("no fireplace");

var balconyGood = new Array("balcony");
var balconyBad = new Array("no balcony");

var timesAvailable = new Array("January", "Jan", "February", "Feb", "March", "Mar", "April", "Apr", "June", "Jun", "July", "Jul", "August", "Aug", "September", "Sept", "October", "Oct", "November", "Nov", "December", "Dec", "immediately");

//make sure words like 'deck' aren't highlighted
timesAvailable = $.map(timesAvailable, function(monthName) { return (" " + monthName + "[. ]"); });

// }}}

// User-Set Variables {{{

var user_rentMin;
var user_rentMax;

var user_catsOn;
var user_dogsOn;
var user_fireplaceOn;
var user_balconyOn;
var user_dishwasherOn;

var user_goodLocations;
var user_badLocations;
var user_desirablePhrases;
var user_undesirablePhrases;

// }}}

// Main Function {{{

$(document).ready(function() {

    craigslistHighlighterIsOn = GM_getValue('user_isHighlightingOn', true)
    $("#searchtable > tbody").append(onOffSwitch());

    if(!craigslistHighlighterIsOn) {
        return;
    }

    // attach listener that saves data to Search button 
    document.getElementById("searchform").addEventListener("submit", scrapeAndSaveUserData, false);

    // Insert extra controls
    $("#searchtable > tbody").append(preferredLocationsControl());
    $("#searchtable > tbody").append(preferredPhrasesControl());
    $("#searchtable > tbody").append(preferredFeaturesCheckboxes());

    loadAndInsertUserData();

    processListingsPage();

    processIndividualPage();
});

// }}}

// Helper Functions {{{

function loadAndInsertUserData() {

    user_rentMin = GM_getValue('user_rentMin', null);
    user_rentMax = GM_getValue('user_rentMax', null);

    user_catsOn = GM_getValue('user_catsOn', null);
    user_dogsOn = GM_getValue('user_dogsOn', null);
    user_fireplaceOn = GM_getValue('user_fireplaceOn', null);
    user_balconyOn = GM_getValue('user_balconyOn', null);
    user_dishwasherOn = GM_getValue('user_dishwasherOn', null);

    user_goodLocations = GM_getValue('user_goodLocations', null);
    user_badLocations = GM_getValue('user_badLocations', null);
    user_desirablePhrases = GM_getValue('user_desirablePhrases', null);
    user_undesirablePhrases = GM_getValue('user_undesirablePhrases', null);

    focusAndSetValue(".min", user_rentMin);
    focusAndSetValue(".max", user_rentMax);

    $("input[name='addTwo']").val(user_catsOn);
    $("input[name='addThree']").val(user_dogsOn);
    $("#chkFireplace").val(user_fireplaceOn);
    $("#chkBalcony").val(user_balconyOn);
    $("#chkDishwasher").val(user_dishwasherOn);

    focusAndSetValue(".goodLocations", user_goodLocations);
    focusAndSetValue(".badLocations", user_badLocations);
    focusAndSetValue(".desirablePhrases", user_desirablePhrases);
    focusAndSetValue(".undesirablePhrases", user_undesirablePhrases);
}

function scrapeAndSaveUserData() {

    user_rentMin = focusAndGetValue(".min");
    user_rentMax = focusAndGetValue(".max");

    user_catsOn = $("input[name='addTwo']").val();
    user_dogsOn = $("input[name='addThree']").val();
    user_fireplaceOn = $("#chkFireplace").val();
    user_balconyOn = $("#chkBalcony").val();
    user_dishwasherOn = $("#chkDishwasher").val();
    user_goodLocations = focusAndGetValue(".goodLocations");
    user_badLocations = focusAndGetValue(".badLocations");
    user_desirablePhrases = focusAndGetValue(".desirablePhrases");
    user_undesirablePhrases = focusAndGetValue(".undesirablePhrases");

    GM_setValue('user_rentMin', user_rentMin);
    GM_setValue('user_rentMax', user_rentMax);

    GM_setValue('user_catsOn', user_catsOn);
    GM_setValue('user_dogsOn', user_dogsOn);
    GM_setValue('user_fireplaceOn', user_fireplaceOn);
    GM_setValue('user_balconyOn', user_balconyOn);
    GM_setValue('user_dishwasherOn', user_dishwasherOn);

    GM_setValue('user_goodLocations', user_goodLocations);
    GM_setValue('user_badLocations', user_badLocations);
    GM_setValue('user_desirablePhrases', user_desirablePhrases);
    GM_setValue('user_undesirablePhrases', user_undesirablePhrases);
}

function focusAndSetValue(selector, value) {
    element = $(selector);
    if(value != null && value != '') {
        // can't use jquery's focus() with greasemonkey (security related, I think)
        element.get()[0].focus();
        element.val(value);
        element.get()[0].blur();
    }
}

function focusAndGetValue(selector) {
    element = $(selector);
    // can't use jquery's focus() with greasemonkey (security related, I think)
    element.get()[0].focus();
    elementValue = element.val();
    element.get()[0].blur();
    return elementValue;
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
            termsFound += extractWords(userbody, user_goodLocations, "#69EF68");
            termsFound += extractWords(userbody, user_desirablePhrases, "#69EF68");
            termsFound += extractWords(userbody, user_badLocations, "#EFB3B3");
            termsFound += extractWords(userbody, user_undesirablePhrases, "#EFB3B3");
            termsFound += extractWords(userbody, timesAvailable, "#BBBBFF");
            if(termsFound != "") { termsFound = "Terms Found: " + termsFound; }

            details += termsFound;
            details += "</strong></font>";

            //add the desired listing details to the listings page
            listing.append(details);      

            //get the updated listing text
            text.value = listing.html();  

            //give the listing the correct background colour based on location
            if(highlightWords(text, user_goodLocations, "#69EF68")) {
                listing.css("background-color", "#AAFFAA");
            }
            if(highlightWords(text, user_badLocations, "#EFB3B3")) {
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

        highlightWords(text, user_goodLocations, "#AAFFAA");
        highlightWords(text, user_desirablePhrases, "#AAFFAA");
        highlightWords(text, user_badLocations, "#FFAAAA");
        highlightWords(text, user_undesirablePhrases, "#FFAAAA");
        highlightWords(text, timesAvailable, "#BBBBFF");

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
            "<td><input class='desirablePhrases dv' value='' style='width:100%'></td>" +
            "<td width='140' align='right'>undesirable phrases:</td>" +
            "<td><input class='undesirablePhrases dv' value='' style='width:100%'></td>" +
            "</tr></tbody></table>" +
        "</td>" +

        "<script type='text/javascript'>$('input.desirablePhrases').DefaultValue('comma separated list');</script>" +
        "<script type='text/javascript'>$('input.undesirablePhrases').DefaultValue('comma separated list');</script>" +
        "</tr>";
}

function preferredFeaturesCheckboxes() {
    return "<tr>" +
        "<td width='1' align='right'>features:</td>" +
        "<td>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='fireplace' id='chkFireplace'>fireplace</label>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='balcony' id='chkBalcony'>balcony</label>" +
        "<label style='padding-right:3px;'><input type='checkbox' value='dishwasher' id='chkDishwasher'>dishwasher</label>" + 
        "</td>" +
        "</tr>";
}

function onOffSwitch() {
    return "<tr>" +
        "<td width='1' align='right'>craigslist highlighter:</td>" +
        "<td><select><option value='on'>On</option><option value='off'>Off</option></select></td>" +
        "</tr";
}

function replaceInArray(array, wordToInsert) {
    return $.map(array, function(phrase) { phrase.replace(/%/g, wordToInsert) });
}

// }}}
