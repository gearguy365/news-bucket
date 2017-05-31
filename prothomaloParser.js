var http = require('http');
var xmlParser = require('xml2js').parseString;
var fs = require('fs');
var Logger = require('./custom_modules/logger.js');
var news_service = require('./custom_modules/news-service.js');
var request = require('request');
var cheerio = require('cheerio');
var newsDb;
var sources = 
    [{
        category: 'international',
        links: ['http://www.prothom-alo.com/international-usa',
            'http://www.prothom-alo.com/international-uk',
            'http://www.prothom-alo.com/international-india',
            'http://www.prothom-alo.com/international-pakistan',
            'http://www.prothom-alo.com/international-asia']
    },
    {
        category: 'bangladesh',
        links: ['http://www.prothom-alo.com/bangladesh-divisions',
            'http://www.prothom-alo.com/bangladesh-politics',
            'http://www.prothom-alo.com/bangladesh-government',
            'http://www.prothom-alo.com/bangladesh-crime',
            'http://www.prothom-alo.com/bangladesh-justice']
    },
    {
        category: 'sports',
        links: ['http://www.prothom-alo.com/sports-nationalcricket',
            'http://www.prothom-alo.com/sports-internationalcricket',
            'http://www.prothom-alo.com/sports-interview',
            'http://www.prothom-alo.com/sports-nationalfootball',
            'http://www.prothom-alo.com/sports-internationalfootball']

    }];

news_service.getNewsDBObject(function (obj) {
    newsDb = obj;
    //Logger.logger('logs/bdnews24RSSParserLog.txt', 'Started prothom-alo parsing');
    init();
});

function init () {
    var resolveCount = 0;
    Logger.logger('logs/prothomaloParserLog.txt', 'started parsing prothom alo');
    var promises = [];
    sources.forEach(function (source, sourcesCount) {
        source.links.forEach(function (link, linksCount) {
            request(link, function (error, response, html) {
                processHtmlContent(html, link, source.category).then(function (response) {
                    resolveCount++;
                    Logger.logger('logs/prothomaloParserLog.txt', 'extraction completed from : ' + link);
                    if (resolveCount == 15) {
                        Logger.logger('logs/prothomaloParserLog.txt', 'prothom alo parsing completed');
                        setTimeout(function() {
                            newsDb.closeConnection();
                            process.exit();
                        }, 3000);
                    }
                });
                // if (sourcesCount == sources.length - 1 && linksCount == source.links.length - 1) {
                //     Promise.all(promises).then(function (params) {
                //         Logger.logger('logs/prothomaloParserLog.txt', 'prothom alo parsing completed');
                //     });
                // }
            });
        });
    });
   
}

function processHtmlContent (html, link, category) {
    return new Promise (function (resolve, reject) {
        var $ = cheerio.load(html);
        var promises = [];
        var contents = $('.content_type_article');
        contents.each(function (a, b, c) {
            var newObject = {};

            newObject.Title = $(this).find('.info').find('h2').text();
            newObject.Description = $(this).find('.info').find('.summery').text();
            newObject.PubDate = $(this).find('.info').find('.additional').find('span').attr('data-published');
            newObject.Link = 'http://www.prothom-alo.com/' + $(this).find('.link_overlay').attr('href');
            newObject.Guid = newObject.Link.match(/http:\/\/[a-zA-Z0-9.-]*\/[a-zA-Z0-9.]*\/[a-zA-Z0-9.]*\/[a-zA-Z0-9.]*/g)[0];
            newObject.Category = category;
            newObject.ImageLink = 'http:' + $(this).find('.image').find('img').attr('src');
            newObject.Source = 'prothomalo';
            newObject.Status = 'inactive';
            // Logger.logger('logs/prothomaloParserLog.txt', 'extracted news with GUID : ' + newObject.Guid);
            promises.push(saveNews(newObject).then(function (response) {
                Logger.logger('logs/prothomaloParserLog.txt', 'creation ' + response + ', post title :' + newObject.Title);
            }));
            
            // newsCollection.push(newObject);
            // if (a == contents.length - 1) {
            //     resolve(newsCollection);
            // }

        });
        Promise.all(promises).then(function () {
            resolve();
        });
    });
}

function saveNews(news) {
    return new Promise(function (resolve, reject) {
        newsDb.getPostByProperty({ Guid: news.Guid }, 0, 1, function (post) {
            if (post.length == 0) {
                newsDb.createPost(news, function (response) {
                    resolve(response);
                });
            } else {
                resolve('aborted')
            }
        });
    });
}