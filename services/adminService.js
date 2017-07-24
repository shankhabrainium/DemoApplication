var express = require("express");
var Admin = require('../models/admin');

var config = require('../config');

var secretKey = config.secretKey;

var async = require("async");

var adminService = {
  adminSignup: function(adminData, callback){
      async.waterfall([
          function(nextcb){       //checking email existance
              var cError1 = "";
              Admin.findOne({email: adminData.email}, function(err, admindet){
                  if(err)
                      nextcb(err);
                  else{
                      if (admindet) {
                          cError1 = "email already taken";
                      }
                      nextcb(null, cError1);
                  }
              });
          },
          function(cError1, nextcb){    //updating admin's data
              if(cError1){
                  nextcb(null, cError1);
              } else {
                  var admin = new Admin(adminData);
                  admin.save(function(err){
                      if(err){
                          nextcb(err);
                      } else {
                          nextcb(null, cError1);
                      }
                  });
              }
          }

      ], function(err, cError){
          if(err){
              callback({success: false, message: "some internal error has occurred", err: err});
          } else if(cError != ""){
              callback({success: false, message: cError});
          } else {
              callback({success: true, message: "Admin saved successfully"})
          }
      });
  }
};
module.exports = adminService;
