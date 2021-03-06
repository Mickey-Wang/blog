# Express + MongoDB搭建多人博客

> 这是一个node初学项目

## node启动指令
 - 利用node-inspector调试：node-debug -p 8081 app
 - 跨平台的设置环境变量并启动：cross-env NODE_ENV=test node app
 - 热更新启动：supervisor --harmony index
 
## package.json中的包版本表示
首先解释下版本号的命名，比如1.15.2。
  `1.15.2`对应就是`marjor version.minor version.patch version`。
  
  - major version：这个版本号变化了表示有了一个不可以和上个版本兼容的大更改。
  - minor version：这个版本号变化了表示有了增加了新的功能，并且可以向后兼容。
  - patch version：这个版本号变化了表示修复了bug，并且可以向后兼容。

然后解释例如~1.15.2和^3.3.4表示的意义。

  - 波浪符号（~）:  
    他会更新到当前minor version（也就是中间的那位数字）中最新的版本。放到我们的例子中就是：body-parser:~1.15.2，这个库会去匹配更新到1.15.x的最新版本，如果出了一个新的版本为1.16.0，则不会自动升级。波浪符号是曾经npm安装时候的默认符号，现在已经变为了插入符号。
  - 插入符号（^）:  
    这个符号就显得非常的灵活了，他将会把当前库的版本更新到当前major version（也就是第一位数字）中最新的版本。放到我们的例子中就是：bluebird:^3.3.4，这个库会去匹配3.x.x中最新的版本，但是他不会自动更新到4.0.0。
  
因为major version变化表示可能会影响之前版本的兼容性，所以无论是波浪符号还是插入符号都不会自动去修改major version，因为这可能导致程序crush，可能需要手动修改代码。
 
 
## 本项目开发过程中遇到的问题及注意点
 - 关闭数据库。在打开一个MongoDB连接后，后续操作发生异常或执行完数据操作一定记着关闭该连接。
 - 如果在渲染ejs时，遇到`esc is not a function`报错信息，那么先排查一下在`res.render()`中传入ejs的参数是否正确。
 - 在数据操作中，`$`符号开头的参数均为mongoDB操作符，如`$inc`，应去mongoDB文档查询
 
## 基础功能
 1. 多人注册、登录；
 2. 发表文章（支持markdown）；
 3. 上传文件；
 4. 文章的编辑与删除；
 5. 存档；
 6. 标签；
 7. 分页；
 8. 留言（支持markdown）；
 9. 用户个人主页；
 10. 文章pv统计及留言统计；
 11. 增加用户头像；
 12. 标题关键字查询（支持有限的正则查询）；
 13. 友情链接；
 14. 404页面；
 15. 转载功能；
 16. 日志功能；
 
## 附加功能
 1. 使用passport引入OAuth登录机制，github授权登录；
 2. 使用mongoose；
 3. 使用Async异步编程类库；
 4. 使用kindEditor[富文本编辑器](http://kindeditor.net/demo.php)；
 5. 使用Handlebars[模板引擎](http://handlebarsjs.com/)；
 6. 使用Disqus第三方社会化评论系统；（介于国内网络原因，暂做了解）
 
