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
        links: ['http://www.kalerkantho.com/online/world']
    },
    {
        category: 'bangladesh',
        links: ['http://www.kalerkantho.com/online/national',
                'http://www.kalerkantho.com/online/country-news']
    },
    {
        category: 'sports',
        links: ['http://www.kalerkantho.com/online/sport']

    }
    ];

news_service.getNewsDBObject(function (obj) {
    newsDb = obj;
    init();
});

function init () {
   var resolveCount = 0;
    Logger.logger('logs/kalerkonthoParserLog.txt', 'started parsing kalerkontho');
    sources.forEach(function (source, sourcesCount) {
        source.links.forEach(function (link, linksCount) {
            request(link, function (error, response, html) {
                processHtmlContent(html, link, source.category).then(function (response) {
                    resolveCount++;
                    // console.log('extraction completed form ' + link);
                    Logger.logger('logs/kalerkonthoParserLog.txt', 'extraction completed from : ' + link);
                    if (resolveCount == 4) {
                        Logger.logger('logs/kalerkonthoParserLog.txt', 'kalerkontho parsing completed');
                        // console.log('exiting process');
                        setTimeout(function () {
                            process.exit();
                        }, 3000)
                    }
                });
            });
        });
    });
}

function processHtmlContent (html, link, category) {
    return new Promise (function (resolve, reject) {
        var $ = cheerio.load(html);
        var promises = [];
        var contents = $('.mid_news').find('.col-xs-12');
        contents.each(function (a, b, c) {
            var newObject = {};

            newObject.Title = $(this).find('a').first().text();
            newObject.Description = $(this).find('.summary').find('p').text();
            // newObject.ubDate = new Date().toISOString();
            newObject.Link = 'http://www.kalerkantho.com' + $(this).find('a').attr('href').slice(1);
            
            var newsUrlSplitted = newObject.Link.split('/');
            newObject.PubDate = new Date(newsUrlSplitted[5], parseInt(newsUrlSplitted[6]) - 1, newsUrlSplitted[7]).toISOString();
            newObject.Guid = newObject.Link;
            newObject.Category = category;
            newObject.ImageLink = $(this).find('.img').find('img').attr('src');
            newObject.Source = 'kalerkontho';
            // Logger.logger('logs/prothomaloParserLog.txt', 'extracted news with GUID : ' + newObject.Guid);
            promises.push(saveNews(newObject).then(function (response) {
                Logger.logger('logs/kalerkonthoParserLog.txt', 'creation ' + response + ', post title :' + newObject.Title);
            }));
        });
        Promise.all(promises).then(function () {
            resolve();
        });
    });
}

function saveNews(news) {
    return new Promise(function (resolve, reject) {
    //     newsDb.getPostByProperty({ Guid: news.Guid }, 0, 1, function (post) {
    //         if (post.length == 0) {
                newsDb.createPost(news, function (response) {
                    // console.log(news);
                    resolve(response);
                });
        //     } else {
        //         resolve('aborted')
        //     }
        // });
    });
}