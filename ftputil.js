/**
 * Provides several methods to interface the FTP repository
 */
const PromiseFtp = require('promise-ftp');
var ftp = new PromiseFtp();

const formData = require('./formData');
const path = require('path');

const ftpUserData = formData.getFtpData();
var ftpromise = Promise.resolve();
/**
* send a mergePDF to distant FTP
* @param {mergePdf} mergePDF - list of the pdf files to be merged
* @returns {*}
*/
exports.sendFtp = function (mergePdf) {
    return _sendFtp(mergePdf);
}

var _sendFtp = function (mergePdf) {
    const path = require('path');


    var fileName = path.basename(mergePdf.pdfname);
    var fileNameCharts = path.basename(mergePdf.pdfcharts);


    if (fileName !== "Nil") {
        ftpromise = ftpromise.then(() => {
            return ftpPut(mergePdf.pdfname, ftpUserData.directory
                + fileName, true);
        })
            .then(() => { ftp.system(); })
            .catch((err) => {
                if (err.message === 'read ECONNRESET') {
                    console.log('FTP reconnect' + fileName);
                    //ftp.reconnect();
                    const delay = require('delay');
                    return (async () => {
                        const result = await delay(Math.random() * 20000 + 10000, { value: mergePdf });
                        _sendFtp(result);
                    });
                } else {

                    throw err;
                }
            });
    }
    if (fileNameCharts !== "Nil") {
        ftpromise = ftpromise.then(() => {
            ftpPut(mergePdf.pdfcharts, ftpUserData.directory
                + fileNameCharts, true);
        })
            .then(() => { ftp.system(); })
            .catch((err) => {
                if (err.message === 'read ECONNRESET') {
                    console.log('FTP reconnect' + fileNameCharts);
                    //ftp.reconnect();
                    const delay = require('delay');
                    return (async () => {
                        const result = await delay(Math.random() * 5000 + 1000, { value: mergePdf });
                        _sendFtp(result);
                    });
                } else {
                    throw err;
                }
            });
    }

}

var ftpPut = function (fileIn, fileDest) {
    return ftp.put(fileIn, fileDest);
}



var _sendContinuousCommand = async function (com) {
    if (ftp.getConnectionStatus() === PromiseFtp.STATUSES.CONNECTED) {
        console.log('Server keep Link');
        ftp.system().then(function (system) {
            console.log('Status:' + system);
        })
            //ftp.list(com).then(function (list) {
            //console.log('Directory listing:');
            //console.dir(list);
            //})
            .catch((err) => {
                if (ftp.getConnectionStatus() !== PromiseFtp.STATUSES.CONNECTED) { ftp.reconnect(); }
            });
    }
    else if (ftp.getConnectionStatus() === PromiseFtp.STATUSES.DISCONNECTED) {
        console.log('Reconnect Server');
        ftp.connect({
            host: ftpUserData.host, user: ftpUserData.user, password: ftpUserData.password,
            autoReconnect: true
        });
    }


    const delay = require('delay');
    var result = await delay(Math.random() * 5000 + 500, { value: com });
    _sendContinuousCommand(result);

}

exports.connect = function () {
    return ftp.connect({
        host: ftpUserData.host, user: ftpUserData.user, password: ftpUserData.password,
        autoReconnect: true
    });//.then(_sendContinuousCommand('/'));
}

/**
 * Delete the files of a ftp directory indicated by dirpath having the indicated extension
 * if extension is empty, delete all the content, if recursively is true delete recursively
 */
exports.deleteDirContent = function (ftpconnect, dirpath, extension, recursively) {
    _deleteDirContent(ftpconnect, dirpath, extension, recursively);

}

/**
 * Delete the files of a ftp directory, indicated by dirpath, having the indicated extension
 * if extension is empty, delete all the content, if recursie is true delete recursively.
 * The function delete only the files. The directory structure is not impacted.
 * @param {string} dirpath Directory where the files are
 * @param {string} extension extension of the files to be deleted (format '.txt',...)
 * @param {boolean} recursively boolean 
 */
var _deleteDirContent = async function (dirpath, extension, recursively) {
    //check the connection
    if (ftp.getConnectionStatus() === PromiseFtp.STATUSES.DISCONNECTED) {
        console.log('Reconnect Server');
        ftp.connect({
            host: ftpUserData.host, user: ftpUserData.user, password: ftpUserData.password,
            autoReconnect: true
        });
    }
    //first list the content of dirpath
    ftp.list(dirpath).then(function (pathList) {
        //run accross the files set in dirpath
        for (var i in pathList) {
            var f = pathList[i];
            if (recursively) {
                //if it is a directory
                if ((f.type === 'd') && (f.name !== '.') && (f.name !== '..')) {
                    var newPath = path.join(dirpath, f.name);
                    _deleteDirContent(newPath, extension, recursively);
                }
            }
            //if it is a file
            if (f.type === '-') {
                if (path.extname(f.name) === extension) {
                    ftp.delete(path.join(dirpath, f.name));
                }
            }
        }
    });
}