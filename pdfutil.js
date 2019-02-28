/**
 * Provides several methods to write and merge pdf files
 */
const path = require('path');
/**
* Merge the PDF files set in the list and returns the name of the final file
* @param {AptIndividualFileInfo[]} list - list of the pdf files to be merged
* @returns {string} - 
*/
exports.mergePdf = function (list) {
  var pdflist = [];
  const fs = require('fs');

  //filter the undefined file. In case of...
  list.forEach(element => {
    if (path.basename(element.name) !== "undefined")
      pdflist.push(element.name);
  });

  //retrieve the Icao code and create the full file (include the administrative data)
  var name = list[0].icao;
  var pdfname = "Nil";
  var pdfNameCharts = "Nil";
  if (name.lastIndexOf('.') == -1)
    {pdfname = path.join(global.LocalMergePdfAipDir, name + "_full.pdf");
    pdfNameCharts = path.join(global.LocalMergePdfAipDir, name + "_charts.pdf");
  }

  else
    {pdfname = path.join(global.LocalMergePdfAipDir, name + "_full");
      pdfNameCharts = path.join(global.LocalMergePdfAipDir, name + "_charts");
    }

  var merge = require('easy-pdf-merge');

  //merge only if there is several file. Else we perform a copy and rename the file
  //create the Fukll document (administrative data and charts)
  if (pdflist.length > 1) {
    merge(pdflist, pdfname, function (err) {
      if (err) {
        console.log("Error during merging of " + pdfname);
        return console.log(err);
      }
    });
    //create the charts pdf
    pdflist.shift(); //remove the administrative data (the first data)
    if (pdflist.length > 1) {
      merge(pdflist, pdfNameCharts, function (err) {
        if (err) {
          console.log("Error during merging of " + pdfNameCharts);
          return console.log(err);
        }
      });
    }
    else if (pdflist.length == 1) {
      const fsextra = require('fs-extra');
      fsextra.copy(pdflist[0], pdfNameCharts);
    }
  }
  else if (pdflist.length == 1) {
    const fsextra = require('fs-extra');
    fsextra.copy(pdflist[0], pdfname);
    pdfNameCharts = "Nil";
  }

  else
    return "Nil";
    
/**
@typedef mergePdf
@type {object}
@property {string} pdfname - path for pdf full file.
@property {string} pdfcharts - path for the pdf chartsfile.
@property {number} icao - icao code of the airport.
*/
  var mergePdf = {
    pdfname: pdfname,
    pdfcharts: pdfNameCharts,
    icao: name
  }
  //return pdfname;
  return mergePdf;
}