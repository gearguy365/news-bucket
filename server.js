var express = require('express');
var app = express();

var port = process.env.PORT || 8080;

app.get('/news', function (req, res) {
    res.send('this is the news endpoint');
});

app.listen(port, function () {
    console.log('server is listening on port ' + port);
});
