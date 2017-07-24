module.exports = {
	"port" : 2020,
	"secretKey" : "hyrgqwjdfbw4534efqrwer2q38945765",
  production: {
          username:'mongoAdminBIT',
          password:'BiT~2016^MdB',
          host:'162.243.110.92',
          port:'27017',
          dbName:'DemoApp',
          authDb:'admin'
	//mongoose.connection.on
},
local: {
       database : "mongodb://localhost:27017/DemoApp",
       MAIL_USERNAME: "liveapp.brainium@gmail.com",
       MAIL_PASS: "YW5kcm9pZDIwMTY",   
	//mongoose.connection.on
},

topicImagePath:"public/uploads/topicImage/",
profilepicPath:"public/uploads/profilepic/",
categoryImagePath:"public/uploads/categorypic/",
baseUrl:"http://182.74.177.22:2020/",
liveUrl:"http://162.243.110.92:2020/",
logPath:"/ServiceLogs/admin.debug.log",
	dev_mode : true,
    __root_dir: __dirname,
    __site_url: 'http://182.74.177.22:2020/'
}
