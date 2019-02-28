/**
 * Class representing a ATS communication facilities
 */
class com {
 /**
  @typedef com
  @type {com}
  @property {string} service - id of the navaid
  @property {string} callSign - frequency of the navaid
  @property {string} frequency - type of the navaid (VOR, DME,...)
  @property {string} operationsHours - Operational hours of the navaid
  @property {string} remarks - remarks
 */

/**
 * Constructor
 */
    constructor() {
        this.service = "";
        this.frequency = "";
        this.callSign = "";
        this.operationsHours = "";
        this.remarks = "";
    }

    /**
     * Retrieve the ATS com information from a <tr> extracted from an html table.
     * Requires the reference to the cheerio filter
     * @param {tr} tr - tr value
     * @param {*} $ - cheerio filter
     */
    fillFromTr(tr, $) {

        var row = $(tr).children('td')
        this.service = row.eq(0).text();;
        this.frequency = row.eq(2).text();
        this.callSign = row.eq(1).text();
        this.operationsHours = row.eq(3).text();
        this.remarks = row.eq(4).text();

    }
}
module.exports = com;