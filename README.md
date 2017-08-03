#Express + MongoDB搭建多人博客

##node启动指令
 - 利用node-inspector调试：node-debug -p 8081 app
 - 跨平台的设置环境变量并启动：cross-env NODE_ENV=test node app
 - 热更新启动：supervisor --harmony index
 
##本项目开发过程中遇到的问题
 - 关闭数据库
 - ejs遇到esc报错信息
 - package.json中的版本问题
 - 注：$符号开头的均为mongoDB操作符，应去mongoDB文档查询