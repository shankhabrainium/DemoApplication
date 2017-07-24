var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
// Export your module
var UserModels = mongoose.model("User", function () {

    var s = new mongoose.Schema({
        _id: {
            type: String,
            required: true
        },
        fname: {
            type: String,
            required: true
        },
        lname: {
            type: String
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String
        },
        authtoken: {
            type: String,
            default: ''
        },
        apptype: {
            type: String,
            required: true
        },
        image_url: {
            type: String,
            default: ''
        },
        social_id: {
            type: String,
            default: ''
        },
        mobile: {
            type: String,
            default: ''
        },
        devicetoken: {
            type: String,
            default: ''
        },
        user_type: {
            type: String,
            enum: ['Normal', 'Social'],
            default: 'Normal',
            required: true
        },
        random_pasword_checkin: {
            type: String,
            default: ''
        }
    }, {
            timestamps: true
        });
    s.pre('save', function (next) {
        var user = this;
        if (!user.isModified('password'))
            return next();

        bcrypt.hash(user.password, null, null, function (err, hash) {
            if (err) {
                return next(err);
            }

            user.password = hash;
            next();
        });
    });
    s.statics.registerUser = function (user, callback) {
        this.getUserByEmail(user.email, function (res) {
            if (res === null) { //console.log("ttt"); return;
                new UserModels(user).save(function (err, response_data) {
                    if (!err) {
                        console.log("[registered user]");
                        callback({ "response_code": 2000, response_data });
                    } else {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                })
            } else { //console.log(res); return;
                console.log("[user already registered]");
                callback({
                    "response_code": 5000,
                    "response_message":"user already registered",
                    "response_data":res

                })
            }

        })
    }
    s.statics.getUserByEmail = function (email, callback) {
        UserModels.findOne({
            email: email,
            user_type: 'Normal'
        },
            function (err, res) {
                if (err)
                    console.log(err);
                if (!err)
                    callback(res);
            })

    }
    s.statics.socialSignup = function (user, callback) {
        this.getUserByFacebook(user.social_id, function (res) {
            if (res === null) {
                new UserModels(user).save(function (err, response_data) {
                    if (!err) {
                        callback({ "response_code": 2000, response_data });
                    } else {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                })
            } else {
                console.log("[user already registered]");
                UserModels.update({
                    social_id: user.social_id
                }, {
                        $set: {
                            authtoken: user.authtoken,
                            apptype: user.apptype,
                            devicetoken: user.devicetoken
                        }
                    }).exec(function (err, su) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": { err }
                            })
                        }
                        if (!err) {
                            if (su.n === 1 && su.nModified === 1) {
                                callback({
                                    "response_code": 5000,
                                    "response_message": "user already registered.",
                                    "authtoken": user.authtoken,
                                    "response_data": res
                                })
                            }
                        }
                    })
            }
        })
    }
    s.statics.getUserByFacebook = function (faceBookId, callback) {
        UserModels.findOne({
            social_id: faceBookId,
            user_type: 'Social'
        }, function (err, res) {
            if (err)
                console.log(err);
            if (!err)
                callback(res);
        })
    }
    s.statics.verifyUser = function (userData, callback) {
        console.log(userData);
        UserModels.find({
            email: userData.email
        }, function (err, res) {
            console.log(res);
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": { err }
                })
            }
            if (!err) {
                if (res.length == 0) {
                    callback({
                        "response_code": 5002,
                        "response_message": "Email not registered.",
                        "response_data": {}
                    })
                }
                else {
                    if (res[0].social_id === '') {
                        callback({
                            "response_code": 2000,
                            "response_message": "User Found.",
                            "response_data": { res }
                        })
                    }
                    else {
                        callback({
                            "response_code": 5002,
                            "response_message": "Email not registered.",
                            "response_data": {}
                        })
                    }
                }
            }
        })
    }
    s.statics.setMoreInfo = function (moreInfo, callback) {
        console.log(moreInfo);
        if (moreInfo.user_id && moreInfo.cat_id) {
            UserModels.update({
                _id: moreInfo.user_id
            }, {
                    $set: {
                        category: moreInfo.cat_id,
                        location: moreInfo.location,
                        loc: [{ long: moreInfo.long, lat: moreInfo.lat }],
                        paypal_email: moreInfo.paypal_email,
                        cat_selected: true

                    },
                }).exec(function (err, smi) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                    if (!err) {
                        if (smi.n === 1) {
                            UserModels.getProfileDetails(moreInfo.user_id, function (profileRes) {
                                callback({ "response_code": 2000, profileRes });
                            })
                        }
                    }

                })
        }
    }
    s.statics.getProfileDetails = function (user_id, callback) {
        if (user_id) {
            UserModels.findOne({
                _id: user_id
            }, function (err, u) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    })
                }
                if (!err) {
                    callback(u);
                }
            })
        }

    }
    s.statics.login = function (loginData, callback) {
        
        UserModels.findOne({
            email:loginData.email}
            , function (err , profileRes) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                })
            }
            if (profileRes) {
                var p = UserModels.comparePassword(loginData.password, profileRes.password);
                if (p === true) {
                    var token = crypto.randomBytes(32).toString('hex');
                    UserModels.update({
                        _id: profileRes._id
                    }, {
                            $set: {
                                devicetoken: loginData.devicetoken,
                                authtoken: token,
                                apptype: loginData.apptype
                            }
                        }).exec(function (err, us) {
                            if (us.n === 1 && us.nModified === 1) {
                                profileRes.authtoken = token;
                                callback({ "response_code": 2000, "profileRes": profileRes });
                            }
                        })
                }
                if (p === false) {
                    callback({ "response_code": 4001, "response_message": "Wrong password" });
                }
            }
            if(profileRes === null) {
                callback({"response_code":5000,"response_message":"No user found"});
            }
        })
    }
    s.statics.logout = function (logoutData, callback) {
        UserModels.update({
            _id: logoutData.user_id
        }, {
                $set: {
                    authtoken: '',
                    apptype: '',
                    devicetoken: ''
                }
            }).exec(function (err, lu) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    })
                }
                if (!err) {
                    if (lu.n === 1 && lu.nModified === 1) {
                        callback({ "response_code": 2000, "response_message": "You logged out successfully.", "response_data": {} })
                    }
                }
            })
    }
    s.statics.changePayPal = function (paypalData, callback) {
        UserModels.update({
            _id: paypalData.user_id
        }, {
                $set: {
                    paypal_email: paypalData.new_paypal_id
                }
            }).exec(function (err, pu) {
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    })
                }
                if (!err) {
                    if (pu.n === 1 && pu.nModified === 1) {
                        callback({ "response_code": 2000, "response_message": "Your Paypal Id is changed successfully.", "response_data": {} })
                    }
                }
            })
    }
    s.statics.changePassword = function (changePasswordData, callback) {
        UserModels.getProfileDetails(changePasswordData.user_id, function (profileData) {
            if (profileData) {
                var p = UserModels.comparePassword(changePasswordData.password, profileData.password);
                if (p === true) {
                    bcrypt.hash(changePasswordData.new_password, null, null, function (err, hash) {
                        if (err) {
                            return next(err);
                        }
                        if (!err) {
                            var token = crypto.randomBytes(32).toString('hex');
                            UserModels.update({
                                _id: changePasswordData.user_id
                            }, {
                                    $set: {
                                        password: hash,
                                        authtoken: token
                                    }
                                }).exec(function (err, cpu) {
                                    if (err) {
                                        callback({
                                            "response_code": 5005,
                                            "response_message": "INTERNAL DB ERROR",
                                            "response_data": {}
                                        })
                                    }
                                    if (!err) {
                                        if (cpu.n === 1 && cpu.nModified === 1) {
                                            callback({
                                                "response_code": 2000,
                                                "response_message": "Your password is changed successfully",
                                                "response_data": {
                                                    "authtoken": token
                                                }
                                            })
                                        }
                                    }
                                })
                        }

                    });
                }
                if (p === false) {
                    callback({
                        "response_code": 4001,
                        "response_message": "Existing Password Incorrect",
                        "response_data": {}
                    })
                }
            }
        })
    }
    s.statics.updateDeviceToken = function (deviceToken, callback) {
        if (deviceToken.devicetoken && deviceToken.user_id) {
            UserModels.update({
                _id: deviceToken.user_id
            }, {
                    $set: {
                        devicetoken: deviceToken.devicetoken
                    }
                }).exec(function (err, udt) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                    if (!err) {
                        if (udt.n === 1 && udt.nModified === 1) {
                            callback({
                                "response_code": 2000,
                                "response_message": "Device token Updated",
                                "response_data": {}
                            })
                        }
                    }
                })
        }
    }
    s.statics.updateUserProfile = function (profileData, callback) {
        console.log(profileData);
        if (profileData.user_id && profileData.image_url) {
            UserModels.update({
                _id: profileData.user_id
            }, {
                    $set: {
                        fname: profileData.fname,
                        lname: profileData.lname,
                        devicetoken: profileData.devicetoken,
                        apptype: profileData.apptype,
                        mobile: profileData.mobile,
                        image_url: profileData.image_url
                    }
                }).exec(function (err, u) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                    if (!err) {
                        if (u.n === 1 && u.nModified === 1) {
                            UserModels.getProfileDetails(profileData.user_id, function (profileRes) {
                                if (profileRes) {
                                    callback({
                                        "response_code": 2000,
                                        "response_data": profileRes
                                    })
                                }
                            })
                        }


                    }
                })
        }
        if (profileData.user_id && !profileData.image_url) {
            UserModels.update({
                _id: profileData.user_id
            }, {
                    $set: {
                        fname: profileData.fname,
                        lname: profileData.lname,
                        devicetoken: profileData.devicetoken,
                        apptype: profileData.apptype,
                        mobile: profileData.mobile
                    }
                }).exec(function (err, u) {
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": "INTERNAL DB ERROR",
                            "response_data": {}
                        })
                    }
                    if (!err) {
                        if (u.n === 1 && u.nModified === 1) {
                            UserModels.getProfileDetails(profileData.user_id, function (profileRes) {
                                if (profileRes) {
                                    callback({
                                        "response_code": 2000,
                                        "response_data": profileRes
                                    })
                                }
                            })
                        }


                    }
                })
        }
    }
    s.statics.savePassword = function (passData, newPass, callback) {
        bcrypt.hash(newPass, null, null, function (err, hash) {
            if (err) {
                return next(err);
            }
            if (!err) {
                var newPassword = hash;
                UserModels.update({
                    email: passData.email
                }, {
                        $set: {
                            password: newPassword
                        }
                    }).exec(function (err, updated) {
                        if (err) {
                            callback({
                                "response_code": 5005,
                                "response_message": "INTERNAL DB ERROR",
                                "response_data": {}
                            })
                        }
                        if (!err) {
                            if (updated.n === 1 && updated.nModified === 1) {
                                callback({
                                    "response_code": 2000,
                                    "response_message": "Succesfully password saved.",
                                    "response_data": {}
                                })
                            }
                        }
                    })
            }
        });
    }
    s.statics.comparePassword = function (password, dbPassword) {
        return bcrypt.compareSync(password, dbPassword);
    }

    s.statics.getCreatorName = function (user_id, callback) {
        console.log(user_id);
        UserModels.findOne({
            _id: user_id
        }, function (err, u) {
            if (err) {
                callback({
                    "response_code": 5005,
                    "response_message": "INTERNAL DB ERROR",
                    "response_data": {}
                })
            }
            if (!err) {
                var creatorname = u.fname + ' ' + u.lname;
                callback({
                    "response_code": 2000,
                    "response_message": "",
                    "response_data": { creatorname }
                })
            }
        })
    }
    s.statics.authenticate = function (jwtData, callback) {
        if (jwtData.user_id) {
            UserModels.findOne({
                _id: jwtData.user_id
            }, function (err, u) {
                
                if (err) {
                    callback({
                        "response_code": 5005,
                        "response_message": "INTERNAL DB ERROR",
                        "response_data": {}
                    })
                }
                if (!err) {
                    if (u.authtoken && u.authtoken === jwtData.authtoken) {
                        callback({
                            "response_code": 2000,
                            "response_message": "authentication success"

                        })
                    }
                    else {
                        callback({
                            "response_code": 4000,
                            "response_message": "authentication failed"
                        })
                    }

                }
            })
        }
    }
    return s;

}());

module.exports = UserModels;