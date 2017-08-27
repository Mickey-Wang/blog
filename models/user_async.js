var mongodb = require('./db'),
    crypto = require('crypto'),
    async = require('async');


function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

// 存储用户信息
User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48';
    // 要存入数据库的用户信息文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head: head
    };

    /**
     * waterfall(tasks, [callback]): 多个函数依次执行，且前一个的输出为后一个的输入，直到最终的callback。如果中途出错，后边的函数将不会执行。同时，
     * 错误信息以及之前产生的结果，将传给最终的callback
     */
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('users', function (err, colleciton) {
                cb(err, colleciton);
            });
        },
        function (collection, cb) {
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        // 中途报错或正常得到最终结果都会走这个callback
        mongodb.close();
        callback(err, user.ops[0]);
    });
};

// 读取用户信息
User.get = function (name, callback) {

    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            })
        },
        function (db, cb) {
            db.collection('users', function (err, collection) {
                cb(err, collection);
            })
        },
        function (collection, cb) {
            collection.findOne({name: name}, function (err, user) {
                cb(err, user);
            })
        }
    ], function (err, user) {
        mongodb.close();
        callback(err, user);
    });
};