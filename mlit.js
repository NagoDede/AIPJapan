

//formData contains all the password and configuration. Loads it first
const frmData = require('./formData');
const loginpage = 'https://aisjapan.mlit.go.jp/LoginAction.do';

var mainPath;

var RecordDocumentsInDb = async function (eDocList) {
    //Write the edocument in Db
    db.collection('documents').insertMany(eDocList, { ordered: false }).catch((err) => {
      if (err.code == 11000) {
        console.log("Some Documents are duplicated");
      }
      else {
        console.log(err);
      }
    });

    //retrieve the active document from the database. If there is a difference, it means there is an update
    var dbEffective = await db.collection('documents').findOne({ "activeState": true }, { "effectiveDate": 1, "publicationDate": 1 });
    if (dbEffective != null) {
      if ((dbEffective.effectiveDate.getTime() === eDocList.effectiveDoc.effectiveDate.getTime()) &&
        (dbEffective.publicationDate.getTime() === eDocList.effectiveDoc.publicationDate.getTime())) {
        console.log("Current effective document remains effective: " + eDocList.effectiveDoc.effectiveDate);
      }
      else {
        console.log("Document effectivity change");
        //set all the records to activestate false
        var setfalse = db.collection('documents').updateMany({ "activeState": true }, { $set: { "activeState": false } });
        setfalse.then( () => { 
          db.collection('documents').updateOne({
          "effectiveDate": eDocList.effectiveDoc.effectiveDate,
          "publicationDate": eDocList.effectiveDoc.publicationDate
        }, { $set: { "activeState": true } });
      });
        
      }
    }
    else {
      var res = await db.collection('documents').updateOne({
        "effectiveDate": eDocList.effectiveDoc.effectiveDate,
        "publicationDate": eDocList.effectiveDoc.publicationDate
      }, { $set: { "activeState": true } });
    }

    return eDocList;

}

/**
 * launch the analysis
 */
var Launch = async function () {
  //connect to the mongoDB database
  //we share the connection in a global
  global.db = await asyncMongoConnect();

  //connect to the mlit website thanks the login and passsword
  let connected = await connectToMlit(loginpage);
  if (connected) {
    //retrieve the aipdocument list
    //and record the list in mongoDb
    var surfacesList;
    var eDocList = await aipMain.getAipDocuments().then(RecordDocumentsInDb);

    console.log(eDocList);
    //set the effective Date to the project
    utils.setEffectiveDate(eDocList.effectiveDoc.effectiveDate);
    utils.setNextEffectiveDate(eDocList.nextEffectiveDate);
    //creat the effective directory to store the aip file
    utils.setLocalAipDirectory(eDocList.effectiveDoc);
    //retrieve the list of the surfaces and the associated content
    //here is the real work of the scripts
    var surfaceGet = aip.getAipSurface(eDocList.effectiveDoc);
    surfaceGet.then(()=>{
      console.log("*********************************");
      console.log(surfaceGet);}
      );
  }
  else {
    console.log("connection failed");
  }
}

/**
 * Launch the initial request on the mlit page and connect to the AIP main page through 
 * a promise.
 * the formdata is defined in an other file in order to restrict the password and loging
 * @param {string} url url to the mlit page
 */
var connectToMlit = function (url) {
  return new Promise(function (resolve, reject) {
    const formData = frmData.getFormData();
    request.post({ url: loginpage, formData: formData }, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(true);
      }
      else {
        reject(error);
      }
    });
  });
}

/**
 * Connect to mongodb
 */
var asyncMongoConnect = function () {
  return new Promise(function (resolve, reject) {
    const mongoUri = frmData.getMongoLink();
    MongoClient.connect(mongoUri, { useNewUrlParser: true }, function (err, client) {
      if (err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n', err);
        reject(err);
      }
      else {
        console.log('Connected...');
        resolve(client.db("aipDoc"));
      }
    });
  });
}

/*
General loop
**/

//set the request as the request uses a cookie, we transfer the request to the other js files
//thanks the setRequest
const req = require('request');
const aipMain = require('./aip/aipmain');
const aip = require('./aip/aip');
const utils = require('./utils');
const ftputil = require('./ftputil');
const MongoClient = require('mongodb').MongoClient;

const ftpConnect = require('./ftputil').connect();

//configure the request and apply it to different file
var request = req.defaults({ jar: true, strictSSL: false, pool: {maxSockets: 2} });
aipMain.setRequest(request);
aip.setRequest(request);
//same with utils
utils.setRequest(request);

require('events').EventEmitter.defaultMaxListeners = 0;
//launch the request
Launch();

