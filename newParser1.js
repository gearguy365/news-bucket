var http = require('http');

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
            process.send(responseString);
            process.exit();
        });
    }
});

getRequest.on('error', function (error) {
    console.log('an error has occured');
    console.log(error);
});

getRequest.end();
