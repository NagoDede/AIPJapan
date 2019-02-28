/**
 * Provides the general functions to extract the data from the AIP.
 * Data are extracted from yhe mainpage, indicated by the mainPath.
 * It use an external requests object to keep the cookies and authorizations.
 */

var request;
var initialLink;

var mainPath = "";
var aipAdm = require('./aipaerodrome');

const apt = require("./cl_apt");
const cheerio = require('cheerio');

/**
 * Set the request object.
 * Request object is mandatory in order to retrieve the content of the website
 * @param {*} req 
 */
exports.setRequest = function (req) {
    request = req;
    aipAdm.setRequest(request);
}

exports.setMainPage = function (mainpage) {
    mainPath = mainpage;
}

/**
 * Retrieve the list of the surfaces (airport and heliport) list from the content of the summary page
 * @param {*} body 
 */
var getAllSurfaces = function (body) {
    
    var aptList = doAirportList(body);
    
    var heliportList =  doHeliportList(body);//, heliportList);
   //return Promise.all([aptList, heliportList]).then(() => {
       //return {aptList, heliportList};});
}

/**
 * Retrieve the list of all the surfaces.
 * This is done in two parts: first we retrieve the mainPage,
 * Then we retrieve the list of the surfaces and complete the description
 * @param {EDoc} doc 
 */
exports.getAipSurface = function (doc) {
    var url = doc.redirectedLink;
    mainPath = doc.mainPath;

    //retrieve the summary webpage
    var getAipPage = new Promise(function (resolve, reject) {
        request.get(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            }
            else {
                reject(error);
            }
        });
    });
    //extract the airport list from the summarywebpage
    return getAipPage.then(getAllSurfaces);
}


/**
 * Extract the Airport list
 * During the extraction, the function retrieves the airport information and maps
 * @param {*} body 
 * @returns {}
 */
var doAirportList = async function (body) {
    let aptList = [];
    const $ = cheerio.load(body);

    //get the list of the airport
    var ad2details = await $('div[id="AD-2details"]').children().each(async (i, elm) => {
        //get the basic element of the airport
        //filter on the title aerodromes... but there is tricks because the title uses some different values
        //such as AERODROMES\n, AERODROME,...
        var airportTitle;
        var aptIcao;
        var aptLink;

        if ($(elm).is('div[class="H3"]')) {
            airportTitle = $(elm, 'div[class="H3"]').children('a[title*="AERO"]').text();
            aptIcao = airportTitle.substring(1, 5).trim();
            aptLink = $(elm, 'div[class="H3"]').children('a[title*="AERO"]').attr('href');
            //clean the path by removing the anchor
            var posDiese = aptLink.indexOf('#');
            aptLink = aptLink.substr(0, posDiese);

            //retrieve the aerodrome information
            var data = await aipAdm.getAllInfo(mainPath, aptLink, aptIcao, 'aerodrome');

            var airportData = new apt();
            airportData.title = airportTitle.substring(5).trim();
            airportData.icao =aptIcao;
            airportData.link = aptLink;
            airportData.type = 'aerodrome';
            airportData.adminData = data.adminData;
            airportData.navaids = data.navaidItems;
            airportData.charts = data.chartData;
            airportData.com = data.com;

            aptList.push({
                airportData
            });
            console.log(aptList);
            return aptList;
        }
    });
    return aptList;
}

/**
 * Extract the Heliport list
 * @param {*} body 
 */
var doHeliportList = async function (body) {
    let aptList = [];
    const $ = cheerio.load(body);

    //get the list of the airport
    var ad2details = await $('div[id="AD-3details"]').children().each(async (i, elm) => {
        //get the basic element of the airport
        //filter on the title aerodromes... but there is tricks because the title uses some different values
        //such as AERODROMES\n, AERODROME,...
        var airportTitle;
        var aptIcao;
        var aptLink;

        if ($(elm).is('div[class="H3"]')) {
            airportTitle = $(elm, 'div[class="H3"]').children('a[title*="HELI"]').text();
            aptIcao = airportTitle.substring(1, 5).trim();
            aptLink = $(elm, 'div[class="H3"]').children('a[title*="HELI"]').attr('href');
            //clean the path by removing the anchor
            var posDiese = aptLink.indexOf('#');
            aptLink = aptLink.substr(0, posDiese);

            //retrieve the aerodrome information
            var data = await aipAdm.getAllInfo(mainPath, aptLink, aptIcao, 'heliport');

            aptList.push({
                title: airportTitle.substring(5).trim(),
                icao: aptIcao,
                link: aptLink,
                type: 'heliport',
                data_admin: data.adminData,
                navaids: data.naviData,
                charts: data.chartData,
                com: data.com
            });  
        }
    });

    return aptList;
}