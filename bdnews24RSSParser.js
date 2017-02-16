var http = require('http');
var xmlParser = require('xml2js').parseString;



var options = {
    host: "www.banglanews24.com",
    path: "/rss/rss.xml"
};
console.log('started process');

var getRequest = http.request(options, function (res, err) {
    if (err) {
        console.log(err);
    } else {
        var responseString = "";
        // console.log(res);
        res.on("data", function (data) {
            responseString += data;
        });
        res.on("end", function () {
            xmlParser(responseString, function (err, resault) {
                process.send(resault);
                process.exit();
            })
        });
    }
});

getRequest.on('error', function (error) {
    console.log('an error has occured');
    console.log(error);
});

getRequest.end();
