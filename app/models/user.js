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

	encryptPass: function(pass, salt){
		return bcrypt.hashSync(pass, salt);
	}	


});

module.exports = User;