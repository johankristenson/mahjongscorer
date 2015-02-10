Meteor.startup(function () {
	process.env.MAIL_URL = 'smtp://';

/* test email */
Email.send({
  from: "",
  to: "",
  subject: "Meteor Can Send Emails via Gmail",
  text: "Its pretty easy to send emails via gmail."
});

});

