var http = require('http');
var xmlParser = require('xml2js').parseString;
var fs = require('fs');
var Logger = require('./custom_modules/logger.js');
var news_service = require('./custom_modules/news-service.js');
var newsDb;

news_service.getNewsDBObject(function (obj) {
    newsDb = obj;
    Logger.logger('logs/bdnews24RSSParserLog.txt', 'Started bdnews24 parsing');
    getRequest.end();
});

var request_options = {
    host: "www.banglanews24.com",
    path: "/rss/rss.xml"
};

var getRequest = http.request(request_options, function (res, err) {
    if (err) {
        console.log(err);
    } else {
        var responseString = "";

        res.on("data", function (data) {
            responseString += data;
        });
        res.on("end", function () {
            processXMLResponse(responseString);
        });
    }
});

function processXMLResponse(XMLString) {
    xmlParser(XMLString, function (err, resault) {
        Logger.logger('logs/bdnews24RSSParserLog.txt', 'Received RSS feed. ' + resault.rss.channel[0].item.length + ' news found.');
        
        var promises = [];
        resault.rss.channel[0].item.forEach(function (news, count, original) {
            promises.push(saveNews(news).then(function (response) {
                Logger.logger('logs/bdnews24RSSParserLog.txt', 'creation ' + response + ', post title ' + news.title[0]);
            }));
        });
        
        Promise.all(promises).then(function () {
            Logger.logger('logs/bdnews24RSSParserLog.txt', 'Finished bdnews24 parser');
            setTimeout(function () {
                newsDb.closeConnection();
                process.exit();
            }, 3000);
        });
    })
}

getRequest.on('error', function (error) {
    console.log('an error has occured');
    console.log(error);
});

function saveNews(news) {
    return new Promise(function (callback) {
        newsDb.getPostByProperty({ Guid: news.guid[0] }, 0, 1, function (post) {
            if (post.length == 0) {
                newsDb.createPost({
                    Title: news.title[0],
                    Link: news.link[0],
                    Description: news.description[0],
                    PubDate: new Date(news.pubDate[0]).toISOString(),
                    Guid: news.guid[0],
                    Category: 'none',
                    Source: 'bdnews24',
                    Status: 'inactive'
                }, function (response) {
                    callback(response);
                });
            } else {
                callback('aborted')
            }
        });
    });
}