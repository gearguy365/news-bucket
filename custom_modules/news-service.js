var mongoose = require('mongoose');
var uuid = require('node-uuid');

function getNewsDBObject(callback) {
    var options = {
        server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
        replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
    };
    mongoose.connect('mongodb://admin:admin@ds143539.mlab.com:43539/news', options);
    //mongoose.connect('mongodb://localhost:27017/news', options);
    var connection = mongoose.connection;
    connection.once('open', function () {
        callback(new newsDb(connection, uuid.v1()));
    });
    connection.on('error', function (error) {
        console.log('an error occured while trying to connect to mongoDB');
        console.log(error);
        getNewsDBObject(callback);
    });
}

var newsDb = function (connection, id) {
    this.connection = connection;
    this.id = id;
    var postSchema = new mongoose.Schema({
        Title: { type: String, unique: true },
        Link: { type: String, unique: false },
        Description: { type: String, unique: false },
        PubDate: { type: String, unique: false },
        Guid: { type: String, unique: true },
        Category: { type: String, unique: false },
        ImageLink: { type: String, unique: false },
        Source: { type: String, unique: false },
        Status: { type: String, unique: false },
        DetailedDesc: { type: String, unique: false, index: false, maxlength : 2000 }
    });

    var descChunkSchema = new mongoose.Schema({
        Text: { type: String, unique: false },
        PostId: { type: String, unique: false }
    });
    var Post = mongoose.model('Post', postSchema);
    var Chunk = mongoose.model('Chunk', descChunkSchema);

    newsDb.prototype.createPost = function (post, callback) {
        console.log('newsDB instance ' + id);
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
        console.log('newsDB instance ' + id);
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
        console.log('newsDB instance ' + id);
        Post.find({}, {}, { skip: skip, limit: limit }, function (err, posts) {
            if (!err) {
                success(posts);
            } else {
                failure(err);
            }
        });
    }

    newsDb.prototype.getPostByProperty = function (searchObj, skip, limit, success, failure) {
        console.log('newsDB instance ' + id);
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
                        newsDb.prototype.getChunkByProperty({PostId : post.id}, function (chunks) {
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
        console.log('newsDB instance ' + id);
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
        console.log('newsDB instance ' + id);
        Chunk.find(searchObj)
            .exec(function (err, data) {
                if (!err) {
                    success(data);
                } else {
                    failure(err);
                }
            });
    }

    newsDb.prototype.closeConnection = function () {
        console.log('newsDB instance ' + id);
        connection.close();
    }
};

module.exports.getNewsDBObject = getNewsDBObject;