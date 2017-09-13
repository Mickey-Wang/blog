# Express + MongoDB搭建多人博客

## node启动指令
 - 利用node-inspector调试：node-debug -p 8081 app
 - 跨平台的设置环境变量并启动：cross-env NODE_ENV=test node app
 - 热更新启动：supervisor --harmony index
 
## 本项目开发过程中遇到的问题
 - 关闭数据库
 - ejs遇到esc报错信息
 - package.json中的版本问题
 - 注：$符号开头的均为mongoDB操作符，应去mongoDB文档查询
 - chrome中收藏标签
 
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
 
