      /**
  @typedef EDoc
  @type {object}
  @property {boolean} activeState - true if the document is the effctive one
  @property {date} effectiveDate - Date of effectivity
  @property {date} publicationDate - Publication Date
  @property {string} publicationDateText - Publication Date, text extracted from the webpage
  @property {string} link - basic path to the electronic document the webpage
  @property {string} mainPath - main path where the data could be retrieved. It is built from the date.
  @property {string} redirectedLink - link to the document page
 */

class EDoc {

 constructor()  {
    this.activeState = false;
    this.effectiveDate = Date;
    this.publicationDate = Date;
    this.publicationDateText = "";
    this.link = "";
    this.mainPath ="";
    this.redirectedLink ="";
  }
}
module.exports = EDoc;