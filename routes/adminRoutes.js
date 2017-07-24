var express = require("express");
var Admin = require('../models/admin');
var adminService = require('../services/adminService');

var config = require('../config');

var secretKey = config.secretKey;

module.exports = function (app, express) {

  var admin = express.Router();

  admin.post('/adminSignup', function (req, res) {
     var adminData = req.body;
     adminService.adminSignup(adminData, function(response) {
          res.send(response);
      });
  });
  return admin;
}
