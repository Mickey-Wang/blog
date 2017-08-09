// var express = require('express');
// var router = express.Router();
//
// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
//
// module.exports = router;

var crypto = require('crypto'),
    multer = require('multer'), // https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    passport = require('passport');
const assert = require('assert');

// 配置multer上传文件
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({storage: storage})

module.exports = function (app) {
    app.get('/', function (req, res) {
        // 判断是否是第一页，并把请求的页数转换成number类型
        var pageNo = req.query.p ? parseInt(req.query.p) : 1;
        // 查询并返回第page页的Post.pageSize篇文章
        Post.getTen(null, pageNo, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                pageNo: pageNo,
                isFirstPage: (pageNo - 1) == 0,
                isLastPage: ((pageNo - 1) * Post.pageSize + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        })
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('sucess').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        // 检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致！');
            return res.redirect('/reg');//返回注册页
        }
        // 生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        // 检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (err) {
                req.flash('error', err.message);;
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', '用户已存在！');
                return res.redirect('/reg');
            }
            // 如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err.message);;
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功！');
                res.redirect('/');
            })
        })
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('sucess').toString(),
            error: req.flash('error').toString()
        });
    });

    // 通过github登录
    app.get('/login/github', passport.authenticate('github', {session: false}));
    app.get('/login/github/callback', passport.authenticate('github', {
        session: false,
        failureRedirect: '/login',
        successFlash: '登陆成功!'
    }), function (req, res) {
        req.session.user = {
            name: req.user.username,
            head: 'https://gravatar.com/avatar/' + req.user._json.gravatar_id + '?s=48'
            // head: req.user._json.avatar_url
        };
        res.redirect('/');
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        // 生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if (user.password != password) {
                req.flash('error', '密码错误！');
                return res.redirect('/login');//密码错误则跳转到登录页
            }
            //用户名密码都匹配后，将用户信息存入session
            req.session.user = user;
            req.flash('success', '登陆成功！');
            res.redirect('/');//登陆成功后跳转到主页
        })
    });

    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('sucess').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            post = new Post(currentUser.name, currentUser.head,  req.body.title, tags, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err.message);;
                return res.redirect('/');
            }
            req.flash('sucess', '发布成功！');
            res.redirect('/');
        })
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功！');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('sucess').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', upload.array('blogFile', 5), function (req, res) {
        assert.ok(req.files, '上传文件为空！');
        req.flash('success', '文件上传成功！');
        res.redirect('/');
    });

    // 存档页面（所有文章的简略信息）路由
    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err.message);;
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    // 标签页面路由
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if(err){
                req.flash('error', err.message);;
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    // 特定标签的文章页面
    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if(err){
                req.flash('error', err.message);
                return res.redirect('/');
            }
            res.render('tag', {
                title: "TAG:" + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    // 友情链接路由
    app.get('/links', function (req, res) {
        res.render('links', {
            title: "友情链接",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    });

    // 模糊查询路由
    app.get('/search', function (req, res) {
       Post.search(req.query.keyword, function (err, posts) {
           if(err){
               req.flash('error', err.message);
               return res.redirect('/');
           }
           res.render('search', {
               title: "SEARCH:" + req.query.keyword,
               posts: posts,
               user: req.session.user,
               success: req.flash('success').toString(),
               error: req.flash('error').toString()
           })
       })
    });

    // 用户页面路由(分页)
    app.get('/u/:name', function (req, res) {
        // 检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                res.redirect('/');
            }
            //查询并返回该用户的所有文章
            var pageNo = req.query.p ? parseInt(req.query.p) : 1;
            Post.getTen(req.params.name, pageNo, function (err, posts, total) {
                if (err) {
                    req.flash('error', err.message);;
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    pageNo: pageNo,
                    isFirstPage: (pageNo - 1) == 0,
                    isLastPage: ((pageNo - 1) * Post.pageSize + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });


    // 文章页面路由
    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err.message);;
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    // 文章页面引入留言路由
    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        // 留言人的信息构成的评论
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48';
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err.message);;
                return res.redirect('back');
            }
            req.flash('success', '留言成功！');
            res.redirect('back');
        })
    });

    // 编辑文章路由
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        //查询登录用户名下的文章，只有自己的文章才可编辑
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.render('edit', {
                title: "编辑",
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);// 文章页
            if (err) {
                req.flash('error', err.message);;
                return res.redirect(url);
            }
            req.flash('success', '修改成功！');
            res.redirect(url);
        })
    });

    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.flash('success', '删除成功！');
            res.redirect('/');
        })
    });

    // 转载链接的路由
    app.get('/reprint/:name/:day/:title', checkLogin);
    app.get('/reprint/:name/:day/:title', function (req, res) {
        // 根据信息查找文章post文档，确定是否有此篇文章
        Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            }
            var currentUser = req.session.user,
                reprint_from = {name: post.name, day: post.time.day, title: post.title},
                reprint_to = {name: currentUser.name, head: currentUser.head};
            Post.reprint(reprint_from, reprint_to, function (err, post) {
                if(err){
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                req.flash('success', '转载成功！');
                var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
                // 跳转到转载后的文章页面
                res.redirect(url);
            });
        });
    });

    // 当访问的所有路径都不匹配时，访问404页面
    app.use(function (req, res) {
        res.render('404');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录！');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录！');
            res.redirect('back');//返回之前的页面
        }
        next();
    }
}
