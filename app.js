var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');

// var index = require('./routes/index');
// var users = require('./routes/users');
var routes = require('./routes/index');
var settings = require('./settings');
var flash = require('connect-flash');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// 准备日志文件流
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});// use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();

var passport = require('passport'),
    GithubStrategy = require('passport-github').Strategy;

app.use(session({
    secret: settings.cookieSecret,
    key: settings.db, //cookie name
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        // db: settings.db,
        // host: settings.host,
        // port: settings.port
        url: settings.url
    })

}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// 设置模板引擎为handlebars，在加载时进行预编译，而不是在客户端执行代码时编译，更加语义化。这里用的是express-handlebars
// 当我们在选软index.hbs，即res.render('index',{...})时，index.hbs会替换layout.hbs中的{{{body}}}
// {{{htmlContext}}}相当于<%-htmlContext%>，{{textContext}}相当于<%=textContext%>
// 其中each中的this指遍历的每一项
app.engine('hbs', exphbs({
    layoutsDir: 'views', // 设置布局模板文件的目录为views文件夹
    defaultLayout: 'layout', // 设置默认的页面布局模板为layout.hbs
    extname: '.hbs' // 自定义后缀名
}));
app.set('view engine', 'hbs');
app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined', {stream: accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 记录错误日志
app.use(function (err, req, res, next) {
    var meta = '[' + new Date() + ']' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});

// app.use('/', index);
// app.use('/users', users);
// 通过github授权登录
app.use(passport.initialize());// 初始化Passport
passport.use(new GithubStrategy({
    clientID: 'd335f3d7fa728b5ccf9e',
    clientSecret: 'c84636ac4781921258814691fa740ffd8b8ae53d',
    callbackURL: 'http://localhost:3000/login/github/callback'
},function (accessToken, refreshToken, profile, done) {
    done(null, profile);
}));

routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
