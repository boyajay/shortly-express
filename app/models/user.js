var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');



var User = db.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	
	links: function () {
		return this.hasMany(Link);
	},

	encryptPass: function(pass){
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(pass, salt);

		// call func to store salt
		// call func to store hash
	}	


});

module.exports = User;