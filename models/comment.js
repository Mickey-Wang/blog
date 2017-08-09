var mongodb = require('mongodb').Db;
    settings = require('../settings');

// 该文章的作者姓名而非留言人姓名
function Comment(name, day, title, comment) {
    this.name = name;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function (callback) {
    var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;
    mongodb.connect(settings.url, function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                db.close();
                return callback(err);
            }
            collection.update({
                'name': name,
                'time.day': day,
                'title': title
            }, {
                $push: {'comments': comment} // The $push operator appends a specified value to an array.
            }, function (err) {
                db.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}