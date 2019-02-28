/**
 * Class representing a Navaid
 */
class navaid {
 /**
  @typedef navaid
  @type {navaid}
  @property {string} id - id of the navaid
  @property {string} frequency - frequency of the navaid
  @property {string} type - type of the navaid (VOR, DME,...)
  @property {string} magVar - magnetic variation at the Navai position
  @property {string} operationsHours - Operational hours of the navaid
  @property {string} position - Position of the navaid
  @property {string} elevation - elevation of the navaid
  @property {string} remarks - remarks
 */
/**
 * Constructor
 * @param {*} id - Id of the navaid 
 */
    constructor() {
        this.id = "";
        this.frequency = "";
        this.type = "";
        this.magVar = "";
        this.operationsHours = "";
        this.position = "";
        this.elevation = "";
        this.remarks = "";
    }

    /**
     * Retrieve the navaid information from a <tr> extracted from an html table.
     * Requires the reference to the cheerio filter
     * @param {tr} tr - tr value
     * @param {*} $ - cheerio filter
     */
    fillFromTr(tr, $) {

        var row = $(tr).children('td')

        if (row.eq(0).contents().length > 1) {
            this.type = row.eq(0).contents()[0].data;}

        else if (row.eq(0).contents().length > 2){
            this.magVar = row.eq(0).contents()[2].data;
        }
        else {
            this.type = row.eq(0).text().trim();
        }

        this.id = row.eq(1).text().trim();
        this.frequency = row.eq(2).text().trim();
        this.operationsHours = row.eq(3).text().trim();
        this.position = row.eq(4).text().trim();
        this.elevation = row.eq(5).text().trim();
        this.remarks = row.eq(6).text().trim();

    }
}
module.exports = navaid;