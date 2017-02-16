var http = require('http');
var xmlParser = require('xml2js').parseString;
var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://admin:123@ds143539.mlab.com:43539/news');
var db = mongoose.connection;

var postSchema = mongoose.Schema({
    Title: String,
    Link: String,
    Description: String,
    PubDate: String
});
var Post = mongoose.model('Post', postSchema);

logger('logs/bdnews24RSSParserLog.txt', 'Started bdnews24 parsing at ' + new Date().toISOString());

function logger(filePath, message) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (!err) {
            var modifiedData = data + '\n' + message;
            fs.writeFile(filePath, modifiedData);
        }
    });
}

var options = {
    host: "www.banglanews24.com",
    path: "/rss/rss.xml"
};

var getRequest = http.request(options, function (res, err) {
    if (err) {
        console.log(err);
    } else {
        var responseString = "";

        res.on("data", function (data) {
            responseString += data;
        });
        res.on("end", function () {
            xmlParser(responseString, function (err, resault) {
                //process.send(resault);

                process.exit();
            })
        });
    }
});

function createPost (post, callback) {
    var newPost = new Post(post);
    newPost.save(function (err, post) {
        if(err) return console.error(err);
        else {
            console.log('post saved');
        }
    });
}

function getAllPost(callback) {
    Post.find(function (err, posts) {
        if(err) return console.error(err);
    });
}

function getPostByProperty(key, value, callback) {
    Post.find({key : value}, function (err, post) {
        if(err) return console.error(err);
        console.log(post);
    });
}

getRequest.on('error', function (error) {
    console.log('an error has occured');
    console.log(error);
});

getRequest.end();
