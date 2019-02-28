const aippage = 'https://aisjapan.mlit.go.jp/html/AIP/html/DomesticAIP.do';
const aipActivePage = 'https://aisjapan.mlit.go.jp/html/AIP/html/';
const aipIndexPage = "JP-menu-en-JP.html";

const EDoc = require("./cl_edoc");
const cheerio = require('cheerio');
const utils = require("../utils");

var request;
//var publicationList;


/**
 * Set the request object.
 * Request object is mandatory in order to retrieve the content of the website
 * @param {*} req 
 */
exports.setRequest = function (req) {
  request = req;
}

/**
 * Retrieve the publication list
 */
//exports.getPublicationList = function () {
//  return publicationList;
//}

/**
 * Loopback function after the login.
 * If login success (no error), request to load the AipPage
 * @param {*} err Error
 * @param {*} httpResponse 
 * @param {*} body body of the return message
 */
exports.getAipDocuments = async function () {
  var publicationList = await doRequest(aippage).then(scrapData).then(computeCurrentFromDocList);
  return publicationList;
};

/**
 * Perform the request to load the aipmain page
 * @param {*} url 
 */
var doRequest = function (url) {
  return new Promise(function (resolve, reject) {
    request.get(url, aippage, function (err, httpResponse, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(body);
      }
    });
  });
}

/**
 * Retrieves the publication dates and identify the current effective publication.
 * The effective date is retrieved from an id set in a span field. It uses the same algorithm than the
 * mlit website.
 * The publication date is retrieved from the text.
 * @param {*} body 
 */
var scrapData = function (body) {

  const $ = cheerio.load(body);
  let edoclist = [];
  //run accross the table in order ot identify the relevant row
  $('tr').each((i, elm) => {
    if ($(elm).hasClass("odd-row") || $(elm).hasClass("even-row")) {
      var efctDate = getEffectiveDate($(elm).children().first().children("span").attr("id"));
      
      var yyyymmdd = efctDate.getFullYear().toString() + utils.pad(efctDate.getMonth() + 1) + utils.pad(efctDate.getDate());
      var mainPath = aipActivePage.concat(yyyymmdd) + "/eAIP/" + yyyymmdd + "/";

      let edoc = new EDoc();
      
        edoc.activeState= false,
        edoc.effectiveDate= efctDate,
        edoc.publicationDate= getPublicationDate($(elm).children().eq(2).first().text()),
        edoc.publicationDateText= $(elm).children().eq(2).first().text(),
        edoc. link= aipActivePage.concat($(elm).children().eq(1).children("a").attr("href")),
        edoc.mainPath= mainPath,
        edoc.redirectedLink= mainPath + aipIndexPage,
      
      edoclist.push(edoc);
    }
  });
  return edoclist;
}

/**
 * Identify the effective publication through the list of the publication.
 * The choice is  based on the most recent effective date and the most recent publication
 * @param {EDoc} edoclist - List of Edocuments
 */
var computeCurrentFromDocList = function (edoclist) {
  var effectiveDoc;
  var i = 0;
  edoclist.forEach(doc => {
    if (getEffectiveDate.effectiveDate.getTime() === doc.effectiveDate.getTime()) {
      if (getPublicationDate.mostRecentDate.getTime() === doc.publicationDate.getTime()) {
        doc.activeState = true;
        effectiveDoc = doc;
        i = i + 1;
      };
    };
  });

  /**
@typedef EDocList
@property {EDoc} effectiveDoc - Effective Document
@property {Date} nextEffectiveDate - Next Effective Date
*/
  edoclist.effectiveDoc = effectiveDoc;
  edoclist.nextEffectiveDate = getEffectiveDate.nextEffectiveDate;

  if (i == 0) { throw 'Aucune document effectif identifié' }
  if (i > 1) {
    throw 'Plusieur documents effectifs identifiés'
  }
  return edoclist;
}

/**
 * Compute the effective date of the studied publication.
 * The computation is based on the value of the ID field, after the removal of the efct- characters. 
 * This is the same algorithm than the MLIT website. 
 * @param {*} idValue 
 */
var getEffectiveDate = function (idValue) {
  var today = new Date();
  //we record the effective date. This date will be used to identify the effective publication.
  if (typeof getEffectiveDate.effectiveDate == 'undefined') {
    // It has not... perform the initialization
    getEffectiveDate.effectiveDate = new Date(1900, 0, 1);

  }
  //Retrieve the next effective Date
  if (typeof getEffectiveDate.nextEffectiveDate == 'undefined') {
    getEffectiveDate.nextEffectiveDate = new Date(today);
    getEffectiveDate.nextEffectiveDate.setDate(today.getDate() + 30);
  }

  //retrive the effective  date
  var idx2 = idValue.indexOf("efct-");
  if (idx2 >= 0) {
    var efctYear = idValue.substring(5, 9);
    var efctMth = idValue.substring(9, 11);
    var efctDay = idValue.substring(11, 13);

    var tempEfctDate = new Date(Date.UTC(efctYear, efctMth - 1, efctDay));

    tempEfctDate.setUTCHours(0);

    //identify the effective date
    if (tempEfctDate <= today) {
      if (getEffectiveDate.effectiveDate <= tempEfctDate) {
        getEffectiveDate.effectiveDate = tempEfctDate;
      };
    }   //identify the next effective date
    else {
      if (getEffectiveDate.nextEffectiveDate >= tempEfctDate) {
        getEffectiveDate.nextEffectiveDate = tempEfctDate;
      };
    };
  }
  return tempEfctDate;
};

/**
 * Compute the publication date and record the most recent publication date
 * @param {string} link - link to the entry Aip page
 */
var getPublicationDate = function (link) {

  if (typeof getPublicationDate.mostRecentDate == 'undefined') {
    // It has not... perform the initialization
    getPublicationDate.mostRecentDate = new Date(1900, 0, 1);
  }

  var pubDate = new Date(link);
  //we can't use the Date.UTC with a string inputs. In order to keep the UTC date
  //we set UTC hours and UTCdate
  pubDate.setUTCHours(0);
  var day = link.substring(0, 2).trim();
  pubDate.setUTCDate(day);

  //Save the most recent date
  if (pubDate <= Date.now()) {
    if (getPublicationDate.mostRecentDate <= pubDate) {
      getPublicationDate.mostRecentDate = pubDate;
      global.lastPublicationDate = getPublicationDate.mostRecentDate;
    };
  };

  return pubDate;
}