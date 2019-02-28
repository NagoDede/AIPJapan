/**
 * Class representing the airport administrative data
 */
      /**
  @typedef admin
  @type {class}
  @property {string} arpCoord - Coordinate of the ARP
  @property {string} elevation - Date of effectivity
  @property {string} mag_var - Magnetic Variation at the airport
  @property {string} mag_annualchange - Annual change of the magnetic variation
  @property {string} geoid_undulation - Geoid ondulation at the airport
  @property {string} traffic_types - Type of traffic at the airport
 */
class admin {

    /**
     * Constructor
     */
    constructor() {
        this.arpCoord;
        this.elevation;
        this.mag_var;
        this.mag_annualchange;
        this.geoid_undulation;
        this.traffic_types;
    }

    /**
         * Retrieve the ATS com information from a <tr> extracted from an html table.
         * Requires the reference to the cheerio filter
         * @param {tr} tr - tr value
         * @param {*} $ - cheerio filter
         */
    fillFromBodyTable(body) {
        var trList = body.find('tr');

        this.arpCoord = trList.eq(0).children().eq(2).text();

        //get the elevation
        var elev = trList.eq(2).children().eq(2).text();
        var posChar = elev.indexOf('/');
        this.elevation = elev.substring(0, posChar).trim();
        this.geoid_undulation = trList.eq(3).children().eq(2).text();
        var magvar = trList.eq(4).children().eq(2).text();
        var posChar = magvar.indexOf('/');
        var length = magvar.length;
        this.magvar = magvar.substring(0, posChar).trim();
        this.mag_annualchange = magvar.substring(posChar, length);
        this.traffic_types = trList.eq(6).children().eq(2).text();
    }
}

module.exports = admin;