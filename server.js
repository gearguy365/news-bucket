var express = require('express');
var kue = require('kue');
var child_process = require('child_process');
var fs = require('fs');
var scheduler = require('node-schedule');
var news_service = require('./custom_modules/news-service.js');
var newsDb;

news_service.getNewsDBObject(function (obj) {
    newsDb = obj;
});

var queue = kue.createQueue();

//sample long running calcualtion process================
queue.process('calculation', function (job, done) {
    var degree = job.data.degree;

    var worker = child_process.fork('calculation_runner.js', [degree]);

    worker.on('message', function (message) {
        console.log(message);
    })

    worker.on('close', function () {
        done();
    });
});
//======================================================

//bdnews24 parser process===============================
queue.process('parse-bdnews24-rss', function (job, done) {
    var worker = child_process.fork('bdnews24RSSParser.js', []);

    worker.on('message', function (message) {
        console.log(message);
    });

    worker.on('close', function () {
        done();
    });
});
//=======================================================

//prothomalo parser process===============================
queue.process('parse-prothomalo-scrape', function (job, done) {
    var worker = child_process.fork('prothomaloParser.js', []);

    worker.on('message', function (message) {
        console.log(message);
    });

    worker.on('close', function () {
        done();
    });
});
//=======================================================

//run queue in a series of processes every 1 mins=======
scheduler.scheduleJob('*/5 * * * *', function () {
    queue.create('parse-bdnews24-rss', {})
        .priority('high')
        .save(function (err) {
            if (!err) {
                console.log('bdnews parsing job created');
            }
        })
        .on('complete', function () {
            console.log('bdnews parsing job completed!');
        });
    queue.create('parse-prothomalo-scrape', {})
        .priority('high')
        .save(function (err) {
            if (!err) {
                console.log('prothomalo parsing job created')
            }
        })
        .on('complete', function () {
            console.log('prothomalo parsing job completed!');
        })
});
//========================================================

//initializing Express app and exposing endpoints=========
var app = express();
var port = process.env.PORT || 3000;

app.get('/news', function (req, res) {
    console.log('received request');
    newsDb.getAllPost(0, 5, function (response) {
        res.type('json');
        console.log('sending response');
        res.send(JSON.stringify(response));
    }, function (error) {
        console.log(error);
        res.send('something went wrong');
    });
});

app.listen(port, function () {
    console.log('server is listening on port ' + port);
});
//========================================================
