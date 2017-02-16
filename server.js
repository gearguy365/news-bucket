var express = require('express');
var kue = require('kue');
var child_process = require('child_process');
var fs = require('fs');

var app = express();
var queue = kue.createQueue();

queue.process('calculation', function (job, done) {
    var degree = job.data.degree;

    // var worker = child_process.spawn('node', ['calculation_runner.js', degree]);
    var worker = child_process.fork('calculation_runner.js', [degree]);

    worker.on('message', function (message) {
        console.log('message received from process : ' + message);
    })

    // worker.stdout.on('data', function (data) {
    //     console.log('stdout: ' + data);
    // });

    worker.on('close', function () {
        done();
    });
});

queue.process('parse-bdnews24-rss', function (job, done) {
    var worker = child_process.fork('bdnews24RSSParser.js', []);

    worker.on('message', function (message) {
        console.log('got the data');
        fs.writeFile('response.json', JSON.stringify(message));
    });

    worker.on('close', function () {
        done();
    });
});

queue.create('parse-bdnews24-rss', {})
    .priority('high')
    .save(function (err) {
        if (!err) {
            console.log('parsing job created');
        }
    })
    .on('complete', function () {
        console.log('parsing job completed!');
    });


var port = process.env.PORT || 8080;

app.get('/news', function (req, res) {
    res.send('this is the news endpoint');
});

app.listen(port, function () {
    console.log('server is listening on port ' + port);
});
