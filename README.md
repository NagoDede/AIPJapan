# AIPJapan
The AIP (Aeronautical Information Publication) Japan is available on the website https://aisjapan.mlit.go.jp/Login.do
The AIP is part of the AIS (Aeronautical Information Service).

The AIP Japan is build over the standard available for the webpublication (more or less, not sure the template is an official standard). The charts are available in PDF fomat only and unfortunately there is one chart per PDF file. For a large airport, it means you have to download several pdf, print, merge,... during your flight preparation. This is time consuming and useless... 

This tool aims to gather the latest (last update) airport information (ICAO code, position, radio frequencies,...) and the charts. The charts will be merge in two PDF files: The [icao]-full.pdf file, whih include all the complementary airport information and a [icao]-charts.pdf which contains only the charts.

The tool will push the data on a FTP site and a Mongo database to record all the data.
At the time being, the pdf files are available on my website fly-out.net/AIPJapan 

# Use
You need an account on aisjapan.mlit.go.jp, ftp login and Mongo link.
All the information are recorded in a formData.js file with the following format:

    var formData = {
        formName: 'ais-web',
        password: 'aisjapan-pwd',
        userID: 'aisjapan-login'
      };

      var ftpData = {
        host: 'ftp-host',
        user: 'ftp-login',
        password: 'ftp-password',
        directory: 'ftp-destination-directory'
      }
      
      var mongoLink = "mongodb+srv://mongologin:mongopwd@cluster0-6y9s1.azure.mongodb.net/test?retryWrites=true";

      exports.getFormData = function() {
        return formData;
      }

      exports.getMongoLink = function() {
        return mongoLink;
      }

      exports.getFtpData = function () {
       return ftpData;
      }
  
  You will have to replace the appropriate value (aisjapan-pwd, aisjapan-login, ftp-host, ftp-login, ftp-password, ftp-destination-directory and mongologin and mongo-password).
  
  # Next steps
  Generate nice web pages to navigate in the files. 
  Retrieve all the navigation data (VOR, airways,...) in order to populate a maps.
  Provide a NOTAM interface to enhance the NOTAM organisation.
