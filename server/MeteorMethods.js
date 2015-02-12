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
});

