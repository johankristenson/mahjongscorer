Meteor.startup(function () {

	Meteor.publish('gameIds', function(yes) {
		if(yes) {
			return Games.find({});//, {fields: {gameName:1, scoreId:1}});
		} else {
			//stop subscription
			return this.stop();
		}
	});
	Meteor.publish('scores',function(id){
		if(id){
			return Scores.find({_id:id});
		} else {
			return this.stop();
		}
	});


	// publish the games that this users read/write permissions to
/*	Meteor.publish("userData", function () {
	  if (this.userId) {
	    return Meteor.users.find({_id: this.userId},
		                     {fields: {'gameId': 1, 'otherstuff': 1}});
	  } else {
	    this.ready();
	  }
	});

// client
Meteor.subscribe("userData");
*/
});

