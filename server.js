var express = require('express');
// var kue = require('kue');
var child_process = require('child_process');
var fs = require('fs');
var scheduler = require('node-schedule');
var news_service = require('./custom_modules/news-service.js');
// var news_service_1 = require('./custom_modules/news-service-1.js');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var cheerio = require('cheerio');
var request = require('request');
require('./config/passport')(passport);
var newsDb;
news_service.getNewsDBObject(function (obj) {
    newsDb = obj;
});

// var queue = kue.createQueue();

//sample long running calcualtion process================
// queue.process('calculation', function (job, done) {
//     var degree = job.data.degree;

//     var worker = child_process.fork('calculation_runner.js', [degree]);

//     worker.on('message', function (message) {
//         console.log(message);
//     })

//     worker.on('close', function () {
//         done();
//     });
// });
//======================================================

//bdnews24 parser process===============================
// queue.process('parse-bdnews24-rss', function (job, done) {
//     var worker = child_process.fork('bdnews24RSSParser.js', []);

//     worker.on('message', function (message) {
//         console.log(message);
//     });

//     worker.on('close', function () {
//         done();
//     });
// });
//=======================================================

//prothomalo parser process===============================
// queue.process('parse-prothomalo-scrape', function (job, done) {
//     var worker = child_process.fork('prothomaloParser.js', []);

//     worker.on('message', function (message) {
//         console.log(message);
//     });

//     worker.on('close', function () {
//         done();
//     });
// });
//=======================================================

//kalerkontho parser process===============================
// queue.process('parse-kalerkontho-scrape', function (job, done) {
//     var worker = child_process.fork('kalerkonthoParser.js', []);

//     worker.on('message', function (message) {
//         console.log(message);
//     });

//     worker.on('close', function () {
//         done();
//     });
// });
//=======================================================

//run queue in a series of processes every 1 mins=======
scheduler.scheduleJob('*/30 * * * *', function () {
    // queue.create('parse-bdnews24-rss', {})
    //     .priority('high')
    //     .save(function (err) {
    //         if (!err) {
    //             console.log('bdnews parsing job created');
    //         }
    //     })
    //     .on('complete', function () {
    //         console.log('bdnews parsing job completed!');
    //     });
    // queue.create('parse-prothomalo-scrape', {})
    //     .priority('high')
    //     .save(function (err) {
    //         if (!err) {
    //             console.log('prothomalo parsing job created')
    //         }
    //     })
    //     .on('complete', function () {
    //         console.log('prothomalo parsing job completed!');
    //     })
    console.log('its time for some scheduled works');
    launchProcessSequence(['bdnews24RSSParser.js', 'prothomaloParser.js', 'kalerkonthoParser.js']);
});
//========================================================

function launchProcessSequence(processes) {
    // var processes = ['bdnews24RSSParser.js', 'prothomaloParser.js', 'kalerkonthoParser.js'];
    console.log('executing process ' + processes[0]);
    var worker = child_process.fork(processes[0], []);

    worker.on('message', function (message) {
        console.log(message);
    });

    worker.on('close', function () {
        worker.kill();
        // console.log(active_pids.length);
        processes.shift();
        // console.log('current stack ' + processes);
        if (processes.length == 0) {
            console.log('all processes are done running');
        } else {
            launchProcessSequence(processes);
        }
    });
}

//initializing Express app and exposing endpoints=========
var app = express();
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://news-bucket.herokuapp.com");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

var port = process.env.PORT || 3000;

app.post('/signup', function (req, res) {
    passport.authenticate('local-signup', function (err, user, info) {
        if (err) {
            res.send({
                status: 1,
                message: err
            });
        } else if (info) {
            res.send({
                status: 1,
                message: info
            });
        } else {
            res.send({
                status: 0,
                message: 'registration successful'
            })
        }
    })(req, res);
});

app.post('/login', function (req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err) {
            res.send({
                status: 1,
                message: err
            });
        }
        else if (info) {
            res.send({
                status: 1,
                message: info
            });
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    res.send({
                        status: 1,
                        message: err
                    });
                }
                res.send({
                    status: 0,
                    message: 'login successful'
                });
            });

        }
    })(req, res, next);
});

app.get('/logout', function (req, res) {
    req.logout();
    res.status(200).send('success');
});

app.post('/news-activation', function (req, res) {
    if (req.isAuthenticated()) {
        //activate/deactivat~e here
        var id = req.body.id;
        var status = req.body.status;
        if (!id || !status) {
            res.status(403).send('bad request');
        } else {
            newsDb.updatePost(id, {Status : status}, function () {
                res.send({
                    status : 0,
                    message : 'update successful'
                });
            });
        }
    } else {
        res.status(401).send('unauthorized');
    }
})

app.get('/news', function (req, res) {
    console.log('received request');
    var filterObject = {};
    if (req.query.category) {
        filterObject.Category = req.query.category;
    }
    if (req.query.source) {
        filterObject.Source = req.query.source;
    }
    if (req.query.title) {
        filterObject.Title = new RegExp(req.query.title, 'i');
    }

    var skip = !req.query.skip ? 0 : parseInt(req.query.skip);
    var limit = !req.query.limit ? 10 : parseInt(req.query.limit);


    newsDb.getPostByProperty(filterObject, skip, limit, function (response) {
        res.type('json');
        console.log('sending response');
        res.send(JSON.stringify(response));
    }, function (error) {
        console.log(error);
        res.send('something went wrong');
    });
});

app.get('/news/:id', function (req, res) {
    console.log('received request');
    // if (req.isAuthenticated()) {
    newsDb.getPostByProperty({ _id: req.params.id }, 0, 5, function (response) {
        var newsObject = response[0];

        if (newsObject._doc.DescChunks.length != 0) {
            res.type('json');
            console.log('sending response');
            res.send(JSON.stringify(newsObject));
        } else {
            request(newsObject.Link, function (error, response, html) {
                var $ = cheerio.load(html);
                switch (newsObject.Source) {
                    case 'prothomalo':
                        // newsObject.DetailedDesc = $('article').find('p').text();
                        // // newsObject.DetailedDesc = newsObject.DetailedDesc.slice(0, newsObject.DetailedDesc.length/2);
                        // newsDb.updatePost(newsObject._id, {DetailedDesc : newsObject.DetailedDesc});
                        var desc = $('article').find('p').text();
                        var descChunkArray = desc.match(/.{1,200}/g);
                        newsObject._doc.DescChunks = descChunkArray;
                        

                        descChunkArray.forEach(function (chunk) {
                            newsDb.createChunk({
                                Text : chunk,
                                PostId : newsObject._id
                            });
                        });
                        break;
                    case 'kalerkontho':
                        
                        break;
                    case 'bdnews24':
                        
                        break;

                    default:
                        break;
                }
                res.type('json');
                console.log('sending response');
                res.send(JSON.stringify(newsObject));
            });
        }
    }, function (error) {
        console.log(error);
        res.send('something went wrong');
    });
    // } else {
    //     res.status(401).send('unauthorized');
    // }
});

app.listen(port, function () {
    console.log('server is listening on port ' + port);
    // console.log(active_pids.length);
});
//========================================================
