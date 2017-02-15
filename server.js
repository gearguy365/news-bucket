var express = require('express');
var kue = require('kue');
var child_process = require('child_process');
var xmlParser = require('xml2json');

var app = express();
var queue = kue.createQueue();

queue.process('calculation', function (job, done) {
    var degree = job.data.degree;
    var worker = child_process.spawn('node', ['newsParser1.js', degree]);

    worker.on('message', function (message) {
        console.log('message received from process : ' + message);
    })

    worker.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
    });

    worker.on('close', function () {
        done();
    });
});

// queue.process('parse-news-1', function (job, done) {
//     var degree = job.data.degree;
//     var worker = child_process.spawn('node', ['newsParser1.js']);
//
//     worker.on('message', function (message) {
//         console.log('message received from process : ' + message);
//     })
//
//     worker.on('stdout', function (message) {
//         console.log('message received from process : ' + message);
//     })
//
//     worker.stdout.on('data', function (data) {
//         console.log('stdout: ' + data);
//     });
//
//     worker.on('close', function () {
//         done();
//     });
// });

for (var i = 5; i < 8; i++) {
    queue.create('calculation', {degree : i})
    .priority('high')
    .save(function (err) {
        if (!err) {
            console.log('parsing job 1 created');
        }
    })
    .on('complete', function () {
        console.log('parsing job 1 was completed!');
    });
}

var port = process.env.PORT || 8080;

app.get('/news', function (req, res) {
    res.send('this is the news endpoint');
});

app.listen(port, function () {
    console.log('server is listening on port ' + port);
});
