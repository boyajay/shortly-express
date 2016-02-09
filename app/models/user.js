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
	initialize: function() {
		this.on('saving', this.savePassword);
	},
	savePassword: function(user, attrs, options) {
		return new Promise( function(resolve, reject) {
			var salt = bcrypt.genSaltSync(10);
	        var hash = bcrypt.hashSync(attrs.password, salt);
			user.set('salt', salt);
			user.set('password', hash);
			resolve();
		});

	},

	// encryptPass: function(pass, salt){
	// 	return bcrypt.hashSync(pass, salt);
	// }	


});

module.exports = User;