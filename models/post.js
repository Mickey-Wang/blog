var mongodb = require('./db'),
    markdown = require('markdown').markdown;


function Post(name, title, tags, post) {
    this.name = name;
    this.tilte = title;
    this.tags = tags;
    this.post = post;
}
// 分页常量
Post.pageSize = 2;

module.exports = Post;

// 保存文章
Post.prototype.save = function (callback) {
    var date = new Date();
    // 存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    // 要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.tilte,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
    }

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // 读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 将文档插入posts集合
            collection.insert(post, {
                w: 1// http://kyfxbl.iteye.com/blog/1952941
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}

// 获取所有文章（Post.pageSize篇分页）
Post.getTen = function (name, pageNo, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            // 根据query对象查询对象。使用count返回特定查询的文档总数total
            collection.count(query, function (err, total) {
                // 根据query对象查询，并跳过前(pageNo-1)*Post.pageSize个结果，返回之后的Post.pageSize个结果
                collection
                    .find(query)
                    .skip((pageNo - 1) * Post.pageSize)
                    .limit(Post.pageSize)
                    .sort({
                        time: -1
                    }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    // 解析 markdown 为 html
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    })
                    callback(null, docs, total);// 成功！以数组形式返回查询结果
                });
            })
        });
    });
};

// 获取所有标签
Post.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //The distinct command returns a list of distinct values for the given key across a collection.
            collection.distinct('tags',function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);// 返回的docs就是只包含不重复tags值的一个数组
            })
        })
    })
};

// 获取特定标签的所有文章
Post.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mogodb.close();
                return callback(err);
            }
            // 查询所有tags数组内包含tag的文档
            // 返回只含有name, title, time组成的数组
            collection.find({
                "tags": tag
            }).project({
                'name': 1,
                'title': 1,
                'time': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
}

// 获取一篇文章
Post.getOne = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据用户名、时间和文章标题查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                if (err) {
                    return callback(err);
                }
                if (doc) {
                    // 每访问一次，pv值增加一次
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {
                        $inc: {'pv': 1} // Increments the value of the field by the specified amount.
                    },function (err) {
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });

                    // 解析markdown为html
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null, doc);
                }

            })

        })
    })
}

// 返回原始发表的内容（markdown源格式）
Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                } else if (!doc) {
                    return callback(new Error("用户名下无此文章！"));
                }
                callback(null, doc);
            })
        })
    })
}

// 更新一篇文章及相关信息
Post.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.updateOne({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post} //Use the $set operator to prevent the other fields from being left empty
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

// 删除一篇文章
Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.deleteOne({
                'name': name,
                'time.day': day,
                'title': title
            }, {w: 1}, function (err, result) {
                mongodb.close();
                if (err) {
                    return callback(err);
                } else if (result.result.n == 0) {
                    return callback(new Error('删除失败！'))
                }
                callback(null);
            })
        })
    })
}

// 返回所有文章的存档信息
Post.getArchive = function (callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            // 返回只包含name、time、title组成的文档
            collection.find({}).project({
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        })
    })
};

// 通过标题关键字模糊查询文章信息（即支持正则）
Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, 'i');
            collection.find({
                'title': pattern // 传入一个正则对象
            }).project({
                'name': 1,
                'time': 1,
                'title': 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        })
    })
}

