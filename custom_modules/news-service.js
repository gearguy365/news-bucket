var mongoose = require('mongoose');

mongoose.connect('mongodb://admin:admin@ds143539.mlab.com:43539/news');
var connection = mongoose.connection;

function getNewsDBObject (callback) {
    connection.once('open', function () {
        callback(new newsDb());
    })
}

var newsDb = function () {
    var postSchema = new mongoose.Schema({
        Title: { type: String, unique: false },
        Link: { type: String, unique: false },
        Description: { type: String, unique: false },
        PubDate: { type: String, unique: false },
        Guid: { type: String, unique: true }
    });
    var Post = mongoose.model('Post', postSchema);

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
        Post.find(searchObj, {}, { skip: skip, limit: limit }, function (err, post) {
            if (!err) {
                success(post);
            } else {
                failure(err);
            }
        });
    }
};

module.exports.getNewsDBObject = getNewsDBObject;