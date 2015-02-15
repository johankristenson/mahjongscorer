/* server side methods */

Meteor.methods({
  sendEmailInvite: function (to) {
	check([to], [String]);
	var from = Meteor.user().emails[0].address;
	// Let other method calls from the same client start running,
	// without waiting for the email sending to complete.
	this.unblock();

	Email.send({
		to: to,
		from: 'mahjongscorer@kristenson.se',
		subject: "Mahjong game invite from "+from,
		text: "You have been invited to view and add scores to a mahjonggame at http://mahjongscorer.meteor.com"});
	}
/*,  verifyEmail: function () {
	var email = Meteor.user().emails[0].address;
	// Let other method calls from the same client start running,
	// without waiting for the email sending to complete.
	this.unblock();

	Email.send({
		to: email,
		from: 'mahjongscorer@kristenson.se',
		subject: "Please verify your email "+from,
		text: "http://mahjongscorer.meteor.com"});
	}
*/
});


