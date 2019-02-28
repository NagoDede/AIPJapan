/**
 * Class representing the airport data
 */
/**
@typedef Apt
@type {object}
@property {string} title - Airport Name
@property {string} icao - Icao code
@property {string} link - html link to the page where the airport data can be retrieved
@property {string} type - surface type: aerodorme or heliport
@property {admin} adminData- Airport Administrative Data
@property {navaid[]} navaids - Airport Navaids
@property {charts[]} charts - Airport Charts
@property {com[]} com -Aiprts Communication means
*/
class apt {

    /**
     * Constructor
     */
    constructor() {
        this.title ="";
        this.icao = "";
        this.link ="";
        this.type ="";
        this.adminData ;
        this.navaids;
        this.charts;
        this.com;
    }
}

module.exports = apt;