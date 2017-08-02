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
    Comment = require('../models/comment.js');
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

var upload = multer({ storage: storage })

module.exports = function (app) {
    app.get('/', function (req, res) {
        // 判断是否是第一页，并把请求的页数转换成number类型
        var pageNo = req.query.p ? parseInt(req.query.p) : 1;
        // 查询并返回第page页的Post.pageSize篇文章
        Post.getTen(null, pageNo, function (err, posts, total) {
            if(err){
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
        if(password_re != password){
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
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            if(user) {
                req.flash('error', '用户已存在！');
                return res.redirect('/reg');
            }
            // 如果不存在则新增用户
            newUser.save(function (err, user) {
                if(err) {
                    req.flash('error', err);
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

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        // 生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function (err, user) {
            if(!user){
                req.flash('error', '用户不存在！');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //检查密码是否一致
            if(user.password != password){
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
        var cureentUser = req.session.user,
            post = new Post(cureentUser.name, req.body.title, req.body.post);
        post.save(function (err) {
            if(err){
                req.flash('error', err);
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

    // 用户页面路由(分页)
    app.get('/u/:name', function (req, res) {
        // 检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if(!user){
                req.flash('error', '用户不存在！');
                res.redirect('/');
            }
            //查询并返回该用户的所有文章
            var pageNo = req.query.p ? parseInt(req.query.p) : 1;
            Post.getTen(user.name, pageNo, function (err, posts, total) {
                if(err){
                    req.flash('error', err);
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
            if(err){
                req.flash('error', err);
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
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if(err){
                req.flash('error', err);
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
            if(err) {
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
            if(err){
                req.flash('error', err);
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
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.flash('success', '删除成功！');
            res.redirect('/');
        })
    });

    function checkLogin(req, res, next) {
        if(!req.session.user){
            req.flash('error', '未登录！');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if(req.session.user){
            req.flash('error', '已登录！');
            res.redirect('back');//返回之前的页面
        }
        next();
    }
}
