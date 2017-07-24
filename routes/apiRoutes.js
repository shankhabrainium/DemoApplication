'use strict';
var express = require("express");
var apiService = require('../services/apiService');
var bodyParser = require('body-parser');
var config = require('../config');

var secretKey = config.secretKey;

module.exports = function (app, express) {

  var api = express.Router();
    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({
        extended: false
    }));

  api.post('/signupUser', function (req, res) {
   apiService.signupUser(req.body, function(response) {
        res.send(response);
    });
  });
  api.post('/login', function (req, res) {
     apiService.login(req.body,function(loginRes){
         res.send(loginRes);
     })
  });
  api.post('/logout', function (req, res) {
     apiService.logout(req.body,function(loginRes){
         res.send(loginRes);
     })
  });
  api.post('/socialSignup', function (req, res) {
     apiService.socialSignup(req.body, function(response) {
          res.send(response);
      });
  });
  
  api.post('/updateProfile', function (req, res) {
     apiService.updateProfileData(req.body,req.files , function(profileDataRes) {
          res.send(profileDataRes);
      });
  });
  api.post('/changePassword' , function(req , res){
    apiService.changePassword(req.body,function(passwordRes){
      res.send(passwordRes);
    })
  });
  api.post('/forgotPassword' , function(req , res){
    apiService.forgotPassword(req.body,function(passwordRes){
      res.send(passwordRes);
    })
  });
  api.post('/changeDeviceToken' , function(req , res){
    apiService.updateDeviceToken(req.body,function(passwordRes){
      res.send(passwordRes);
    })
  });

  return api;
}
