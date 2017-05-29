var mongoose = require('mongoose');

var newsDb = function () {

    var options = {
        server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
        replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
    };
    mongoose.connect('mongodb://admin:admin@ds143539.mlab.com:43539/news', options);
    //mongoose.connect('mongodb://localhost:27017/news', options);
    var connection = mongoose.connection;

    var postSchema = new mongoose.Schema({
        Title: { type: String, unique: false },
        Link: { type: String, unique: false },
        Description: { type: String, unique: false },
        PubDate: { type: String, unique: false },
        Guid: { type: String, unique: true },
        Category: { type: String, unique: false },
        ImageLink: { type: String, unique: false },
        Source: { type: String, unique: false },
        Status: { type: String, unique: false },
        DetailedDesc: { type: String, unique: false, index: false, maxlength: 2000 }
    });

    var descChunkSchema = new mongoose.Schema({
        Text: { type: String, unique: false },
        PostId: { type: String, unique: false }
    });
    var Post = mongoose.model('Post', postSchema);
    var Chunk = mongoose.model('Chunk', descChunkSchema);

    function init() {
        connection.once('open');
    }

    newsDb.prototype.createPost = function (post, callback) {

        var newPost = new Post(post);
        newPost.save(function (err, post) {
            if (!err) {
                callback('success');
            } else {
                callback('failed');
            }
        });

    }

    newsDb.prototype.updatePost = function (id, changedData, callback) {

        Post.findById(id, function (err, post) {
            if (err) return handleError(err);

            for (var key in changedData) {
                post[key] = changedData[key];
            }

            post.save(function (err, savedPost) {
                if (err) return handleError(err);
                if (callback) {
                    callback(savedPost);
                }
            });
        });

    }

    newsDb.prototype.getAllPost = function (skip, limit, success, failure) {

        Post.find({}, {}, { skip: skip, limit: limit }, function (err, posts) {
            if (!err) {
                success(posts);
            } else {
                failure(err);
            }
        });

    }

    newsDb.prototype.getPostByProperty = function (searchObj, skip, limit, success, failure) {

        Post.find(searchObj)
            .skip(skip)
            .limit(limit)
            .sort('-PubDate')
            .exec(function (err, data) {
                if (!err) {
                    if (data.length == 0) {
                        success(data);
                    }
                    data.forEach(function (post, count) {
                        newsDb.prototype.getChunkByProperty({ PostId: post.id }, function (chunks) {
                            post._doc.DescChunks = chunks;
                            if (count == data.length - 1) {
                                success(data);
                            }
                        });
                    });
                } else {
                    failure(err);
                }
            });

    }

    newsDb.prototype.createChunk = function (chunk, callback) {


        var newChunk = new Chunk(chunk);
        newChunk.save(function (err, chunk) {
            if (callback) {
                if (!err) {
                    callback('success');
                } else {
                    callback('failed');
                }
            }
        });

    }

    newsDb.prototype.getChunkByProperty = function (searchObj, success, failure) {


        Chunk.find(searchObj)
            .exec(function (err, data) {
                if (!err) {
                    success(data);
                } else {
                    failure(err);
                }
            });

    }
};

module.exports.newsDb = newsDb;