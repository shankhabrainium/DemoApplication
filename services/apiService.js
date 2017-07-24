'use strict';
var express = require("express");
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var crypto = require('crypto');
var sha1 = require('node-sha1');
var fs = require('fs');
var util = require('util');
var logger = require('morgan');
var CronJob = require('cron').CronJob;
var mailProperty = require('../modules/sendMail');
var ObjectID = mongo.ObjectID;
var baseUrl = config.baseUrl;
//======================MONGO MODELS============================
var UserModels = require('../models/user');
//======================MONGO MODELS============================
//======================LOGGER==================================
var logFile = fs.createWriteStream(__dirname + config.logPath + new Date().toISOString().slice(0, 19).replace('T', ' '), {
    flags: 'a'
});
var logStdout = process.stdout;
var baseUrl = config.baseUrl;
console.log = function () {
    logFile.write(
        "\n===:" + new Date() + ":\n" +
        util.format.apply(null, arguments) +
        '\n===\n'
    );
    logStdout.write(
        "\n===:" + new Date() + ":\n" +
        util.format.apply(null, arguments) +
        '\n===\n'
    );
}
console.error = console.log
//======================LOGGER KEY==============================
var apiService = {
    jwtAuthVerification: (jwtData, callback) => {
        if (jwtData.authtoken && jwtData.user_id) {
            UserModels.authenticate(jwtData, function (auth) {
                callback(auth);
            })
        }
    },
    signupUser: (userData, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!userData.fname || typeof userData.fname === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide first name", "response_data": {} });
                }
                else if (!userData.email || typeof userData.email === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide email", "response_data": {} });
                }
                else if (!userData.password || typeof userData.password === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide password", "response_data": {} });
                }
                else {
                    nextCb(null, { "response_code": 2000 });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code === 2000) {
                    userData._id = new ObjectID;
                    userData.authtoken = crypto.randomBytes(32).toString('hex');
                    UserModels.registerUser(userData, function (signUpRes) {
                        nextCb(null, signUpRes);
                    })
                }
                if (arg1.response_code === 5002) {
                    nextCb(null, arg1);
                }
            }
        ],
            function (err, content) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": err
                    })
                }
                if (!err) {
                    console.log(content);
                    if (content.response_code === 2000) {
                        callback({
                            "response_code": 2000,
                            "response_message": "You have registered successfully.",
                            "response_data": {
                                "authtoken": content.response_data.authtoken,
                                "cat_selected": content.response_data.cat_selected,
                                "profile_type": content.response_data.user_type,
                                "profile_details": {
                                    "rating": content.response_data.rating,
                                    "user_id": content.response_data._id,
                                    "fname": content.response_data.fname,
                                    "lname": content.response_data.lname,
                                    "email": content.response_data.email,
                                    "profile_pic": content.response_data.image_url ? config.liveUrl + config.profilepicPath + content.response_data.image_url : '',
                                    "mobile": content.response_data.mobile
                                }
                            }
                        })
                    }
                    if (content.response_code === 5000) {
                        //callback(content);
                         callback({
                            "response_code": 5000,
                            "response_message": "Already registered.",
                            "response_data": {
                                "authtoken": content.response_data.authtoken,
                                "cat_selected": content.response_data.cat_selected,
                                "profile_type": content.response_data.user_type,
                                "profile_details": {
                                    "rating": content.response_data.rating,
                                    "user_id": content.response_data._id,
                                    "fname": content.response_data.fname,
                                    "lname": content.response_data.lname,
                                    "email": content.response_data.email,
                                    "profile_pic": content.response_data.image_url ? config.liveUrl + config.profilepicPath + content.response_data.image_url : '',
                                    "mobile": content.response_data.mobile,
                                }
                            }
                        })
                    }
                    if (content.response_code === 5005) {
                        callback(content);
                    }
                    if (content.response_code === 5002) {
                        callback(content);
                    }
                }
            })
    },

    socialSignup: (userData, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!userData.fname || typeof userData.fname === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide first name", "response_data": {} });
                }
                else if (!userData.email || typeof userData.email === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide email", "response_data": {} });
                }
                else if (!userData.devicetoken || typeof userData.devicetoken === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide device token", "response_data": {} });
                }
                else if (!userData.social_id || typeof userData.social_id === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide social id", "response_data": {} });
                }
                else {
                    nextCb(null, { "response_code": 2000 });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code === 5002) {
                    nextCb(null, arg1);
                }
                if (arg1.response_code === 2000) {
                    userData._id = new ObjectID;
                    userData.authtoken = crypto.randomBytes(32).toString('hex');
                    userData.user_type = 'Social';
                    UserModels.socialSignup(userData, function (socialSignupRes) {
                        nextCb(null, socialSignupRes);
                    })
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                })
            }
            if (!err) {
                if (content.response_code === 2000) {
                    callback({
                        "response_code": 2000,
                        "response_message": "You have registered successfully.",
                        "response_data": {
                            "authtoken": content.response_data.authtoken,
                            "profile_type": content.response_data.user_type,
                            "profile_details": {
                                "rating": content.response_data.rating,
                                "user_id": content.response_data._id,
                                "fname": content.response_data.fname,
                                "lname": content.response_data.lname,
                                "email": content.response_data.email,
                                "profile_pic": content.response_data.image_url ? content.response_data.image_url : '',
                                "mobile": content.response_data.mobile
                            }
                        }
                    })
                }
                if (content.response_code === 5000) {
                    callback({
                        "response_code": 5000,
                        "response_message": "user login successfully.",

                        "response_data": {
                            "authtoken": content.authtoken,
                            "cat_selected": content.response_data.cat_selected,
                            "profile_type": content.response_data.user_type,
                            "profile_details": {
                                "rating": content.response_data.rating,
                                "user_id": content.response_data._id,
                                "fname": content.response_data.fname,
                                "lname": content.response_data.lname,
                                "email": content.response_data.email,
                                "profile_pic": content.response_data.image_url ? content.response_data.image_url : '',
                                "mobile": content.response_data.mobile
                            }
                        }
                    })
                }
                if (content.response_code === 5005) {
                    callback(content);
                }
                if (content.response_code === 5002) {
                    callback(content);
                }
            }
        })
    },
    
    login: (loginData, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!loginData.email || typeof loginData.email === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide email", "response_data": {} });
                }
                else if (!loginData.password || typeof loginData.password === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide password", "response_data": {} });
                }
                else {
                    nextCb(null, { "response_code": 2000 });
                }

            },
            function (arg1, nextCb) {
                if (arg1.response_code === 5002) {
                    nextCb(null, arg1);
                }
                if (arg1.response_code === 2000) {
                    UserModels.login(loginData, function (loginInfo) {
                        nextCb(null, loginInfo);
                    })
                }
            },
            function (arg2, nextCb) {
                if (arg2.response_code === 5002) {
                    nextCb(null, arg2);
                }
                if(arg2.response_code === 4001){
                    nextCb(null,arg2);
                }
                if(arg2.response_code === 5000){
                    nextCb(null,arg2);
                }
                if (arg2.response_code === 2000) {
                    if (arg2.profileRes) {
                        var loginInfo = {
                            "response_code": 2000,
                            "response_message": "Login success.",
                            "response_data": {
                                "authtoken": arg2.profileRes.authtoken,
                                "cat_selected": arg2.profileRes.cat_selected,
                                "profile_type": arg2.profileRes.user_type,
                                "profile_details": {
                                    "rating": arg2.profileRes.rating,
                                    "user_id": arg2.profileRes._id,
                                    "fname": arg2.profileRes.fname,
                                    "lname": arg2.profileRes.lname,
                                    "email": arg2.profileRes.email,
                                    "profile_pic": arg2.profileRes.image_url ? config.liveUrl + config.profilepicPath + arg2.profileRes.image_url : '',
                                    "mobile": arg2.profileRes.mobile
                                }
                            }
                        }
                        nextCb(null, loginInfo);
                    }
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                })
            }
            if (!err) {
                if (content.response_code === 5005) {
                    callback(content);
                }
                if (content.response_code === 5002) {
                    callback(content);
                }
                if(content.response_code === 4001){
                    callback(content);
                }
                if (content.response_code === 2000) {
                    callback(content);
                }
                if(content.response_code === 5000){
                    callback(content);
                }
            }
        })
    },
    logout: (logoutData, callback) => {
        if (logoutData.user_id && logoutData.apptype) {
            UserModels.logout(logoutData, function (logoutRes) {
                callback(logoutRes);
            })
        }
        else {
            callback({
                "response_code": 5002,
                "response_message": " insufficient information provided",
                "response_data": {}
            })
        }
    },
    changePassword: (changePasswordData, callback) => {
        if (changePasswordData.user_id && changePasswordData.password && changePasswordData.new_password) {
            UserModels.changePassword(changePasswordData, function (passwordRes) {
                callback(passwordRes);
            })
        }
        else {
            callback({
                "response_code": 5002,
                "response_message": " insufficient information provided",
                "response_data": {}
            })
        }
    },
    updateProfileData: (profileData, file, callback) => {
        async.waterfall([
            function (nextCb) {
                if (!profileData.user_id || typeof profileData.user_id === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide user id", "response_data": {} });
                }
                else {
                    nextCb(null, { "response_code": 2000 });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code === 5002) {
                    nextCb(null, arg1);
                }
                if (arg1.response_code === 2000) {
                    var fileData = file;

                    if (fileData != null) {
                        console.log(profileData);
                        var pic = fileData.profileimage;
                        var ext = pic.name.slice(pic.name.lastIndexOf('.'));
                        var fileName = Date.now() + ext;
                        var folderpath = config.profilepicPath;
                        pic.mv(folderpath + fileName, function (err) {
                            if (err) {
                                fileName = null;
                                mediaUrl = "";
                            }
                            if (!err) {
                                profileData.image_url = fileName;
                                UserModels.updateUserProfile(profileData, function (updateProfileRes) {
                                    if (updateProfileRes.response_code === 2000) {
                                        nextCb(null, updateProfileRes);
                                    }
                                    if (updateProfileRes.response_code === 5005) {
                                        nextCb(null, updateProfileRes);
                                    }
                                })
                            }
                        });
                    }
                    if (fileData === null) {
                        UserModels.updateUserProfile(profileData, function (updateProfileRes) {
                            if (updateProfileRes.response_code === 2000) {
                                nextCb(null, updateProfileRes);
                            }
                            if (updateProfileRes.response_code === 5005) {
                                nextCb(null, updateProfileRes);
                            }
                        })
                    }
                }
            }, function (arg2, nextCb) {
                if (arg2.response_code === 5002) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 5005) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 2000) {
                    var profileData = {
                        "response_code": 2000,
                        "response_message": "Profile updated successfully.",
                        "response_data": {
                            "authtoken": arg2.response_data.authtoken,
                            "profile_type": arg2.response_data.user_type,
                            "profile_details": {
                                "rating": arg2.response_data.rating,
                                "user_id": arg2.response_data._id,
                                "fname": arg2.response_data.fname,
                                "lname": arg2.response_data.lname,
                                "email": arg2.response_data.email,
                                "profile_pic": arg2.response_data.image_url ? config.liveUrl + config.profilepicPath + arg2.response_data.image_url : '',
                                "mobile": arg2.response_data.mobile,
                            }
                        }
                    }
                    nextCb(null, profileData);
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": err
                })
            }
            if (content.response_code === 2000) {
                callback(content);
            }
        })
    },
    updateDeviceToken: (deviceData, callback) => {
        if (deviceData.devicetoken && deviceData.user_id) {
            UserModels.updateDeviceToken(deviceData, function (deviceDataRes) {
                callback(deviceDataRes);
            })
        }
        else {
            callback({
                "response_code": 5002,
                "response_message": " insufficient information provided",
                "response_data": {}
            })
        }
    },
    
    forgotPassword: (forgotPasswordData, callback) => {
        
        async.waterfall([
            function (nextCb) {
                if (!forgotPasswordData.email || typeof forgotPasswordData.email === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide user email", "response_data": {} });
                }
                else if (!forgotPasswordData.apptype || typeof forgotPasswordData.apptype === undefined) {
                    nextCb(null, { "response_code": 5002, "response_message": "please provide apptype ", "response_data": {} });
                }
                else {
                    nextCb(null, { "response_code": 2000, });
                }
            },
            function (arg1, nextCb) {
                if (arg1.response_code === 5002) {
                    nextCb(null, arg1);
                }
                if (arg1.response_code === 2000) {
                    UserModels.verifyUser(forgotPasswordData, function (userData) {
                        nextCb(null, userData);
                    })
                }
            },
            function (arg2, nextCb) {
                if (arg2.response_code === 5002) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 5005) {
                    nextCb(null, arg2);
                }
                if (arg2.response_code === 2000) {
                    var random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
                    var sh1Pass = sha1(random);
                    UserModels.savePassword(forgotPasswordData, sh1Pass, function (userData) {
                        userData.random = random;
                        nextCb(null, userData);
                    })
                }
            }
        ], function (err, content) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                })
            }
            if (!err) {
                if (content.response_code === 2000) {
                    mailProperty('forgotPasswordMail')(forgotPasswordData.email, {
                        OTP: content.random,
                        email: forgotPasswordData.email
                    }).send();
                    callback({
                        "response_code": 2000,
                        "response_message": "New password will be sent to your mail.",
                        "response_data": {}
                    })
                }
                if (content.response_code === 5002) {
                    callback(content);
                }
                if (content.response_code === 5005) {
                    callback(content);
                }
            }
        })
    }

};
module.exports = apiService;
