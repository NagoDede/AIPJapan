
/**
 * Provides the general functions to extract the data from the AIP Airport page.
 */

var request;
var utils = require('../utils');
var pdfutil = require('../pdfutil');

/**
@typedef AirportData
@type {object}
@property {string} name - name of the pdf file.
@property {string} name - content of the pdf file.
@property {number} icao - icao code of the airport.
*/

let data = [];
const cheerio = require('cheerio')
const path = require('path');
const navaid = require("./cl_navaid");
const com = require("./cl_com");
const admin = require("./cl_admin");

exports.setRequest = function (req) {
  request = req;
}

/**
 * Retrieve the information from an airport webpage
 * @param {*} url - url of the AIP airport page
 * @returns {AptData} - Airport data
 */
exports.getAllInfo = async function (uri, page, icao, surfaceType) {
  //get the airport. This is the main entry point, as all the information are on the page
  var url = uri + page;
  var aipArpPage = await utils.getAirportPage(page, url);

  //get the Charts information before downloading
  var chartData;
  if (surfaceType === 'aerodrome') {
    chartData = await getChartsInformation(uri, aipArpPage, '-AD-2.24');
    //add the pdf administration page
    var fileName = "JP-AD-2-" + icao + "-en-JP.pdf";
    chartData.unshift({
      title: icao,
      link: "pdf/" + fileName,
      fileName: fileName
    });
  }
  else if (surfaceType === 'heliport') {
    chartData = await getChartsInformation(uri, aipArpPage, '-AD-3.23');
        //add the pdf administration page
    var fileName = "JP-AD-3-" + icao + "-en-JP.pdf";
    chartData.unshift({
      title: icao,
      link: "pdf/" + fileName,
      fileName: fileName
    });

  }
  else {
    chartData = await getChartsInformation(uri, aipArpPage, '-AD-2.24');
        //add the pdf administration page
    var fileName = "JP-AD-2-" + icao + "-en-JP.pdf";
    chartData.unshift({
      title: icao,
      link: "pdf/" + fileName,
      fileName: fileName
    });
  }

  let admin;
  let navItem = [];
  let com = [];

  if (surfaceType === 'aerodrome') {
    admin = getAdminstrativeData(aipArpPage, 2);
    navItem = getNavigationData(aipArpPage, '2.19');
    com = getComData(aipArpPage, '2.18');
  }
  else if (surfaceType === 'heliport') {
    admin = getAdminstrativeData(aipArpPage, 3);
    navItem = getNavigationData(aipArpPage, '3.18');
    com = getComData(aipArpPage, '3.17');
  }

  if (navItem.length == 0) { navItem = ""; }

  if (com.length == 0) { com = ""; }

  var chartFile = downloadCharts(chartData, uri, icao);

  /**
  @typedef AptData
  @type {object}
  @property {string} icao - icao code of the surface
  @property {chartData} chartData - Airports Charts information
  @property {chartFile} chartFile - Aiports charts file information
  @property {admin} adminData - Administrative Data
  @property {navaid[]} navaidItems - basic path to the electronic document the webpage
  @property {com[]} com - Aiport communication means
 */
  var data = {
    icao: icao,
    chartData: chartData,
    chartFile: chartFile,
    adminData: admin,
    navaidItems: navItem,
    com: com
  };

  var dbo = global.db.collection("surfaceInfo");
  dbo.replaceOne({ "icao": icao }, data);

  return data;
}



var downloadCharts = function (chartData, uri, icao) {
  //download the Charts.
  //A random delay is set to avoid server overload
  const delay = require('delay');
  var chartFile = "";
  //load the pdf file from the 
  if (chartData.length >= 1) {

    //retrieve the Pdf files and merge them in a single PDF

    return new Promise(function (resolve, reject) {
      //var del = Math.random() * 5000 + 250;
      //const result = await delay(del, { value: chartData });
      var chartFile = getPdfChartFiles(chartData, uri, icao);
      resolve(chartFile);
    });

    //
  };
}
/**
 * Retrieve the PDF Charts, then merge the files in a single pdf file. The file will be named
 * with the ICAO code of the  airport.
 * @param {chartData[]} chartData - chart data object, provides the definition to download the charts
 * @param {string} uri - uri to download the charts
 * @param {strning} icao - icao code of the airport
 */
var getPdfChartFiles = function (chartData, uri, icao) {
  //we create a table, it will allow us to use map and Promise.all
  var array = [];
  chartData.forEach(element => {
    array.push({
      uri: uri,
      elt: element.link,
      icao: icao
    });

  });
  //The charts are recorded in a directory named in accordance with the ICAO code
  const dir = path.join(global.LocalAipDirectory, icao);
  utils.createDirectory(dir);

  var a = Promise.all(array.map(downloadPdf));
  const ftpU = require('../ftputil')
  return a.then(pdfutil.mergePdf).then(ftpU.sendFtp);
}


/**
 * Retrieve the charts information from the body of an airport webpage.
 * Returns a list of chartData which will contains the link to the charts
 * @param {string} uri - uri of the airport web page
 * @param {string} body - content of the airport webpage 
 * @param {chartData[]}
 */
var getChartsInformation = async function (uri, body, mainId) {
  const $ = cheerio.load(body);
  /**
  @typedef chartData
  @type {object}
  @property {string} title - The title of the chart, as defined in the webpage.
  @property {string} link - local link. Shall be completed with the full mlit adress.
  @property {number} fileName - file name of the pdf file.
 */

  /** @type {chartData} */
  let chartData = [];

  //get the list of the airport
  //var ad2details = await $('div[id*="-AD-2.24"]').find('table').find('td').children('a').each(async (i, elm) => {
  var ad2details = await $('div[id*="' + mainId + '"]').find('table').first().find('td').children('a').each(async (i, elm) => {
    //get the basic element of the airport
    //filter on the title aerodromes... but there is tricks because the title uses some different values
    //such as AERODROMES\n, AERODROME,...

    var title = $(elm).text();
    var link = $(elm).attr('href');
    var baseName = "";
    if (link !== undefined) {
      baseName = path.basename(link);

      if ((link.lastIndexOf(".pdf") > -1) || (link.lastIndexOf(".PDF") > -1)) {
        //get types of traffic
        chartData.push({
          title: title,
          link: link,
          fileName: baseName
        });
        return chartData;
      }
    }
  });
  return chartData;
}

/**
 * Retrieve the administrative information of an aiport from the body of an airport webpage.
 * @param {*} body  - content of the webpage
 * @returns {admin} -Airport administrative Data
 */
var getAdminstrativeData = function (body, paraNbr) {
  const $ = cheerio.load(body);
  var ad2details = $('div[id*="-AD-' + paraNbr + '.2"]').children('table').first();
  let adminData = new admin();
  adminData.fillFromBodyTable(ad2details);
  return adminData;
}

/**
 * Retrieve the navigation information of an aiport from the body of an airport webpage.
 * @param {*} body  - content of the webpage
 * @param {*} paraNbr - paragraph number where the data are stored
 * @returns {navaid[]} - Airport Navigation data
 */
var getNavigationData = function (body, paraNbr) {

  const $ = cheerio.load(body);
  let navData = [];
  //get the list of the airport
  var ad2details = $('div[id*="' + paraNbr + '"]').find('table').find('tr');
  if (ad2details.length > 2) {
    ad2details.each((i, elm) => {
      if (i >= 2) {
        var row = $(elm).children('td')
        if (row.eq(1).text().trim() != "Nil") {
          var id = row.eq(1).text().trim();
          let nav = new navaid();
          nav.fillFromTr(elm, $);
          navData.push(nav);

        }
      }
    });
  }
  return navData;
}

/**
 * Retrieve the navigation information of an aiport from the body of an airport webpage.
 * @param {*} body  - content of the webpage
 * @param {*} paraNbr - paragraph number where the data are stored
 * @returns {com[]} - Airport communication means
 */
var getComData = function (body, paraNbr) {

  const $ = cheerio.load(body);
  let comData = [];
  //get the list of the airport
  var ad2details = $('div[id*="' + paraNbr + '"]').find('table').find('tr');
  if (ad2details.length > 3) {
    ad2details.each((i, elm) => {
      if (i >= 2) {
        var row = $(elm).children('td')
        var id = row.eq(1).text().trim();
        if (id != "") {
          let comAts = new com();
          comAts.fillFromTr(elm, $);
          comData.push(comAts);
        }
      }
    });
  }
  return comData;
}

/**
 * Download the Pdf file indicated by the link.
 * A random delay is added to avoid server overload
 * @param {string} link - link to the pdf file
 */
var downloadPdf = function (link) {
  const delay = require('delay');
  return (async () => {
    const result = await delay(Math.random() * 300000 + 500, { value: link });
    return _downloadPdf(result).then(writeCharts);
  })();
}


/**
* Download the Pdf file indicated by the link thanks a Get request.
* Return a Promise which will contain the list of the files associated to the current airport downloaded 
* @param {*} link 
* @returns {AptIndividualFileInfo[]} 
*/
var _downloadPdf = function (link) {
  return new Promise(function (resolve, reject) {
    var options = {
      method: 'GET',
      url: link.uri + link.elt,
      encoding: "binary",
      headers: {
        'Content-Type': 'application/pdf',
      },
      timeout: 120000
    };

    request(options, function (err, httpResponse, body) {
      if (err) {
        console.log("Error during download of " + options.url);
        reject(err);
      }
      else {
        var name = path.basename(httpResponse.request.path);
        /**
        @typedef PdfChartsFile
        @type {object}
        @property {string} name - name of the pdf file.
        @property {string} name - content of the pdf file.
        @property {number} icao - icao code of the airport.
       */
        /** @type {PdfChartsInfo} */
        var b = {
          name: name,
          body: body,
          icao: link.icao
        }
        resolve(b);
      }
    });
  })
}

/**
* Write on the disk the content of the charts pdf element.
* Return a promise
* @param {PdfChartsFile} element - Element of the pdf file, including the content of the pdf file
* @returns {AptIndividualFileInfo} - File information
*/
var writeCharts = function (element) {
  return new Promise(function (resolve, reject) {
    //The charts are recorded in a directory named in accordance with the ICAO code
    const dir = path.join(global.LocalAipDirectory, element.icao);

    const name = path.join(dir, element.name);
    const body = element.body;
    const fs = require('fs');
    const ws = fs.createWriteStream(name);
    ws.write(body, 'binary');
    ws.end();

    ws.on('finish', () => {

      /**
      @typedef AptIndividualFileInfo
      @type {object}
      @property {string} id - name of the file
      @property {string} icao - icao code of the airport assocaited to the file.
      @property {string} path - path to the file
     */
      var b = {
        name: name,
        icao: element.icao,
        path: dir
      };
      resolve(b);
    });
    ws.on("error", reject);
  });
}