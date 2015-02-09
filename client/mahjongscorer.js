//todo
// kunna ta bort en inlagd rad
// X berakna trolig scor for ovriga spelare pa en rad baserat pa inmatade varden nar winner och loser ar iklickade ska det racka att fylla i vardet pa ett stalle.
// X rev17 > fix Template.scoring.getPlayerArray, see http://stackoverflow.com/questions/9544391/mustache-or-handlebars-iterating-over-two-lists needed to have editable divs for the player names with dynamic ids using each getPlayerArray instead of each getPlayerNameArray

// {player1:"Oscar", player2:"Thomas K",player3:"johan k",player4:'Daniel U',GameDate: "2014-05-14 10:00",  {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }
// {gameId, gameName, player1:"Oscar", player2:"Thomas K",player3:"johan k",player4:'Daniel U', GameDate: "2014-05-14 10:00", {rounds: {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }}
// {gameId, gameName, players:{"Oscar", "Thomas K","johan k",'Daniel U'}, GameDate: "2014-05-14 10:00", {rounds: {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }}

// send email to invited players so they know they can join a game.

/*
 * first time game insert
 * Scores.insert({gameId: getGameId(), data:[]});
 *
 * vid lagg till rad
 * Scores.update({_id:get_Id()},{$addToSet: { data: {round:r, score1:pl1score, score2:pl2score, score3:pl3score ,score4:pl4score}});
 *
 * get scores for round r
 * Scores.find({_id:get_Id(), 'data.round':r},{'data.$':1});
*/

var triggerScoreInput = new Deps.Dependency;
Session.setDefault("showMahjongScorecard",false);

var isNumber = function(n) {
return !isNaN(parseFloat(n)) && isFinite(n);
};

Meteor.autorun(function() {
	if(typeof Session.get("SubscribeToId") !== 'undefined'){
		console.log('subscribing to :'+Session.get("SubscribeToId"));
		Meteor.subscribe("scores", Session.get("SubscribeToId"));
		//Scores.findOne({_id:Session.get("SubscribeToId")});
	}



});
	// save reference to be able to use stop and ready
	Meteor.subscribe('gameIds',true);
	Meteor.subscribe("userData");
	Meteor.subscribe('authorization',true);
function FormatNumberLength(num, length) {
	var r = "" + num;
	while (r.length < length) {
		r = "0" + r;
	}
	return r;
};


getGameName = function(numPlayers){
	// change this later
	var currentdate = new Date();
	var datetime = numPlayers+" player game from " + FormatNumberLength(currentdate.getFullYear(),2)+'-'+ FormatNumberLength(currentdate.getMonth()+1,2) +'-'+ FormatNumberLength(currentdate.getDate(),2) + " @ "
        + FormatNumberLength(currentdate.getHours(),2) + ":"
        + FormatNumberLength(currentdate.getMinutes(),2) + ":"
        + FormatNumberLength(currentdate.getSeconds(),2);
	return datetime;
};

get_Id = function() {
	var s= Scores.findOne({players:{$gt:''}});
	if (typeof s !== 'undefined'){
		return s._id;
	} else {
		console.log("No game score in progress " );
		return undefined;
	}
};

getLatestRound = function() {
	var dataarray = Scores.findOne({_id: get_Id()}).data;
	if (typeof dataarray === 'undefined' ) {
		console.log('no data defined for _id '+get_Id()+';ie round = 0');
		return -1;
	}
	var rounds = dataarray.length;
	return rounds;
};

// create new game and scoreboard
newScoreboard = function (numPlayers){
	var currentdate = new Date();
	var gid = "" + currentdate.getDate()
		+ (currentdate.getMonth()+1)  +
		+ currentdate.getFullYear() +
		+ currentdate.getHours() +
		+ currentdate.getMinutes() +
		+ currentdate.getSeconds();
	var gname = getGameName(numPlayers);
	// todo, get sfrom html textboxes
	var gplayers = ["Johan Kristenson", "Daniel Udd","Oscar Lindberg","Thomas Krantz","Erik Hemberg","Martin Hemberg", "Klaus Nolås"].sort(function() {return .5 - Math.random();}).slice(0,numPlayers);
	// unsubscribe to old scoreboard and subscribe to new
	Meteor.subscribe('scores');
	// _id of logged in user

	// create a score document and a game document
	g_id = Scores.insert({gameName: gname, players:gplayers, data:[]}, function(err, id){console.log("error during insert: id of scores.insert: "+id+"   "+err);});
	Games.insert({gameName: gname, creator:Meteor.userId(), scoreId:g_id},function(err, id){console.log("error during insert: id of Games.insert: "+id+"   "+err);});
	// change session variable to trigger subscription change using Meteor.autorun
	Session.set("SubscribeToId",g_id);
	
	console.log("inserting gameName:"+gname+", players: "+gplayers+" _id: "+g_id);
	//listOngoingGameIds();
};

Template.loadgames.helpers({
	hasActiveScoreboard: function() {
		return Scores.find({}).count()==1;
	},

	// return name of current game.
	currentgame: function() {
		var gc = Scores.find({}).count();
		if ( gc==1){
			return Scores.find({},{fields:{gameName:1}}).fetch()[0].gameName;
		} else if (gc>1) {
			return "Error: more than one active scoreboard.";
		} else {
			return "No active scoreboard. Load a scoreboard or start a new one";
		}
	},
	// return game names and ids
	listgamestoload: function() {
		return Games.find({},{scoreId:1,gameName:1});
	}
});
Session.setDefault('handParts',{});
Template.loadgames.events({
	'click button.noofplayers': function(event){
		var clickedButton = event.currentTarget;
		var noOfPlayers = clickedButton.innerHTML;
		if(noOfPlayers >=2 && noOfPlayers<=5){
			newScoreboard(noOfPlayers);
		} else {
			console.log("error: cannot set players to less than 2 or more than 5");
		}		
	},
	'click DIV#load_game.menu': function(e){
		Session.setDefault("showMahjongScorecard",false);
		$('.gamenames').show();
	},
	'click th.tableheaderclose': function(e){
		// hide the game list menu
		$('.gamenames').hide();	
	},
	'click span.gametoload':function(e){
		// hide the game list menu after clicking on a game to load
		// id of object was set to be same as _id of game document in mongo collection.
		myid = $(e.target).attr('id');
		var id = myid;
		console.log(id);
		if(id){
			// change session variable to trigger subscription change using Meteor.autorun
			Session.set("SubscribeToId",id);
			console.log("trying to subscribe to "+id);
			//var gamename = $(e.target).children("span").html();
			var gamename = $(e.target).html();
		//	alert(gamename);
			// set info box to display loaded scoreboard games name
			$('.info').html(gamename);
		}
		// hide the game list
		$('.gamenames').hide();	
	},
	'blur div.info': function(e, t){
		var str = $(e.target).html();
		var scoreId = Scores.findOne()._id;
		//console.log('score id '+scoreId);
		var gameId = Games.findOne({scoreId:scoreId})._id;
		Games.update({_id:gameId},{$set:{gameName:str}});
		Scores.update({_id:scoreId},{$set:{gameName:str}}); // todo. remove gameName field from Scores?		
	}
});

var setScore = function(winnerscore, risktakerscore, playerscore, winnernum, risktakernum){
	var numPlayers = Scores.findOne({}).players.length;
	for(var i =1;i<=numPlayers;i++){
		console.log("distributing score, looping. i = "+i);
		var givescore='';
		if(winnernum==i) {
			givescore= winnerscore.toString();
		} else if(risktakernum==i) {
			givescore= risktakerscore.toString();
		} else {
			givescore= playerscore.toString();
		}
		$("div#player"+i.toString()+"score").text(givescore);
	}
}

var getPlayerNames = function(){
		if (typeof Scores === 'undefined' || typeof Scores.findOne() === 'undefined') {
			return 0;
		}
		// get subscribed documents that have players (ie those subscriptions that only have _ids in order to list the games)
		var ret = Array();
		var playernames = Scores.findOne({}).players;
		for (var i =0; i<playernames.length; i++){
			var entry = { name: playernames[i], number: (i+1) };
			ret[i] = entry;
			console.log('added name and number for i='+i+" name= "+playernames[i]);
		}
		console.log('array length= '+ret.length);
		return ret;
};

var minimumHandPoints = 8;
// distribute the entered score	
var distributeHandPoints = function(){
	//var basescore=parseInt($('input#handscore').val());
	var basescore=parseInt($('span#handscore').text());
	// risktaker and winner must be selected first to help score distribution
	var win = $("input[name=winner]:checked");
	var risk = $("input[name=risktaker]:checked");
	if(win!=='undefined' && risk!=='undefined'){
		var winnernum = win.attr("id").slice(-1);
		var risktakernum = risk.attr("id").slice(-1);
		var winnerscore=0;
		var risktakerscore=0;			
		var playerscore=0;
		var numPlayers = Scores.findOne({}).players.length;
		if(basescore>0 || basescore<0){
			console.log('distributing base score: %s',basescore);
			if (risktakernum==winnernum) {
				if (basescore>=minimumHandPoints) {
					// selfdraw
					winnerscore= (8+basescore)*(numPlayers-1);
					playerscore= -(8+basescore);
				} else {
					// penalty. "winner" is penalized for wrong mahjong or similar.
					winnerscore= -10*(numPlayers-1);
					playerscore= 10;
				}
			} else {
				if (basescore>=minimumHandPoints) {
					// normal scoring hand. no selfdraw or false mahjong.
					winnerscore = basescore + 8*(numPlayers-1);
					risktakerscore= -(8+basescore);
					playerscore= -8;
				} else {
					// penalty. "winner" is penalized for wrong mahjong or similar.
					winnerscore= -10*(numPlayers-1);
					playerscore= 10;
				}					
			}				
		}
		// if score = 0 then it is a a draw not a false mahjong (a chicken hand with 8 points is not 0)
		setScore(winnerscore,risktakerscore,playerscore, winnernum, risktakernum);
	}
};

Template.scorecard.helpers({
	showmahjongscorecard: function () {
		return Session.get("showMahjongScorecard")==true;
	}
});
var DELAY=500,clicks=0; timer=null;
//var handParts={};
Template.scorecard.events({
	'click .onepoint': function (e,templ) {
		// one pointers can be cliked more than once to increase total points. 
		// right click decreases points, left click increases (up to 8 clicks then back to zero)
		console.log('disable blur() for this area unless it is clicked again');
		console.log('"'+e.target+'"');			
	},
	'click .pickpoints': function (e,templ) {
		console.log('add points if left click, remove points if right click');
		console.log('"'+e.target+'"');		
/* left click */
		var handParts=Session.get('handParts');
		if(typeof(handParts)==='undefined') handParts={};
		if(e.button==0){
			clicks++;
			console.log('clicks: %i',clicks);
			if(clicks === 1) {
				// Single click, add points to base score
				timer = setTimeout(function() {
					//var basescore = parseInt($('input#handscore').val());
					var basescore = parseInt($('span#handscore').text());
					if(!isFinite(basescore)) basescore=0;
					console.log('adding score: %s',$(e.target).attr('points'));
					if($(e.target).attr('points')==0) {
						// reset hand score to 0
						basescore=0;
						handParts={};
					} else {
						basescore += parseInt($(e.target).attr('points'));
						if(isNaN(handParts[$(e.target).attr('id')])){
							handParts[$(e.target).attr('id')]=1;
						} else {
							handParts[$(e.target).attr('id')]+=1;
						}
					}
					// set the score box
					$('span#handscore').text(basescore.toString());
					//add name of points to session variable hand
					console.log($(e.target).attr('id'));
					
					console.log("hand: %s",JSON.stringify(handParts));
					// distribute the score of the hand to winner and losers
					clicks = 0;             //after action performed, reset counter
					distributeHandPoints();
				 	console.log('setting handParts session var, make sure code does not bug out prior to this. handParts: %', JSON.stringify(handParts));
					Session.set('handParts', handParts);	
				}, DELAY);
			} else {
				// double click, subtract points from base scores
				clearTimeout(timer);    //prevent single-click action
				//check if these points were added previously, if so remove 1
				clicks = 0;             //after action performed, reset counter

				if(isNaN(handParts[$(e.target).attr('id')]) || handParts[$(e.target).attr('id')]<=0){
					alert('you cannot remove points that have not been added previously');
				} else {
					handParts[$(e.target).attr('id')]-=1;
					console.log("hand: %s",JSON.stringify(handParts));
					//var basescore = parseInt($('input#handscore').val());
					var basescore = parseInt($('span#handscore').text());
					if(!isFinite(basescore)) basescore=0;
					console.log('subtracting score: %s',$(e.target).attr('points'));
					basescore -= parseInt($(e.target).attr('points'));
					$('span#handscore').text(basescore.toString());
					distributeHandPoints(); // warning this method fails sometimes and aborts execution
				 	console.log('setting handParts session var, make sure code does not bug out prior to this. handParts: %', JSON.stringify(handParts));
					Session.set('handParts', handParts);	
				}
			}						
		} else {
			//check if these points were added previously, if so remove 1
			if(isNaN(handParts[$(e.target).attr('id')]) || handParts[$(e.target).attr('id')]<=0 ) {
				alert('you cannot remove points that have not been added previously');
			} else {
				handParts[$(e.target).attr('id')]-=1;
				//var basescore = parseInt($('input#handscore').val());
				var basescore = parseInt($('span#handscore').text());
				if(!isFinite(basescore)) basescore=0;
				console.log('subtracting score: %s',$(e.target).attr('points'));
				basescore -= parseInt($(e.target).attr('points'));
				$('span#handscore').text(basescore.toString());
				distributeHandPoints(); // warning this method fails sometimes and aborts execution
			 	console.log('setting handParts session var, make sure code does not bug out prior to this. handParts: %', JSON.stringify(handParts));
				Session.set('handParts', handParts);	
			} 
		}
	},
	'touchstart .pickpoints':function(e,templ){
		console.log('touch event on pickpoints class');
	},
// highlight points by hovering
	'mouseover area.pickpoints':function(e,templ) {
		$(e.target).focus();
	},
	'mouseout area.pickpoints':function(e,templ) {
		$(e.target).blur();
	}
});

Template.outer.helpers({
	showScoreboard: function(){
		return getLatestRound()>=0;		
	}
});

var risktakerNumTrigger = -1;
Template.enterscore.helpers({
	getPlayerNames:  function(){ 
		return getPlayerNames();
	}
});

Template.enterscore.events({
	'click input.addData': function () {
		console.log("_id for game: "+get_Id());
		if (Scores.find().count()!=1 ){
			console.log("A game was not found!");
			alert('No ongoing game was found.');
			return;
		}
		var playerScore = Array();
		var numPlayers = Scores.findOne({}).players.length;
		var totalScore = 0;
		for(var i =0;i<numPlayers;i++){
			// ----------------------------------------
			// calc of score per player based on hand score and risktaker/winner.
			// ----------------------------------------
			var str = $('div#player'+(i+1)+'score').text();
			var s = parseInt(str);
			playerScore[i] = s;
			totalScore += s;
			console.log("looping. i %i,str %s,s %i, totalScore %i ",i,str,s,totalScore);
		}
		var winnernum = $("input[name=winner]:checked").attr("id").slice(-1);
		var risktakernum = $("input[name=risktaker]:checked").attr("id").slice(-1);			
		if (isNumber(totalScore) && totalScore == 0 && typeof winnernum !== 'undefined') {
			winner = winnernum;
			if (typeof risktakernum !== 'undefined'){
				risktaker = risktakernum;
			}
			var r = getLatestRound();
			r += 1;
			var handParts=Session.get('handParts');
			if(typeof(handParts)==='undefined') {
				var handParts={};
			}
			// add the hand points to the meteor collection Scores
			console.log('adding the hand scoring to Scores %s', JSON.stringify(handParts));
				 
			Scores.update(
				{ _id: get_Id() },
				{ $push: {data: { updatedBy:Meteor.userId(), winner: winner, risktaker:risktaker, round:r, score: playerScore ,handParts: handParts } }}
			);
			// uncheck radiobuttons
			$("input[name=winner]").prop('checked', false);
			$("input[name=risktaker]").prop('checked', false);
			Session.set('handParts',{});
			// reset scores to 0 for active hand
			$('span#handscore').text('0');
			setScore(0,0,0,0,0);
		} else {
			console.log('error : score must balance. ('+totalScore+') does not.');
			alert('score must balance. ('+totalScore+') does not.');
		}
	},
	// recalculates scores after selecting both a winner and a risktaker
	'click input.radiobutton': function(e,templ){
		console.log('clicked radiobutton:' +$(e.target).val());
		//console.log($("input[name=winner]:checked").attr("id"));
		//console.log($("input[name=risktaker]:checked").attr("id"));
		// risktaker and winner must be selected first to help score distribution
		var winnerbutton = $("input[name=winner]:checked");
		var risktakerbutton = $("input[name=risktaker]:checked");;	
		if (!(winnerbutton=='undefined' || risktakerbutton=='undefined')) {
			var winnernum = winnerbutton.attr("id").slice(-1);
			var risktakernum = risktakerbutton.attr("id").slice(-1);
			risktakerNumTrigger=parseInt(risktakernum);		
			triggerScoreInput.changed(); // trigger reload of page for input of scores
			// both the winner and the risktaker are set.
			distributeHandPoints();
		}
	

	},
	'click img.scorecard': function(e, templ){
		Session.set("showMahjongScorecard",!Session.get("showMahjongScorecard"));
		console.log('clicked thumbnail. trigger: %s',Session.get("showMahjongScorecard"));			
	}

});
Template.scoring.helpers({
	getPlayerNames:  function(){ 
		return getPlayerNames();
	},
	hasActiveScoreboard: function() {
		return Scores.find({}).count()==1;
	},
	// sum player score for any player
	// todo. how to access variable in local context using a string.
	playerSum: function(toRound){
		// get toRound rounds starting from round 1 (ie index 0)
		var dataArray = Scores.findOne().data.slice(0,toRound);
		var numPlayers = dataArray[0].score.length;
		var total = new Array(numPlayers);
		var s = new Array(numPlayers);
		for(var i=0;i < dataArray.length;i++){
			for(var j=0; j < numPlayers; j++){
				if(i==0) {
					total[j]=0;
				}
				// score for player (j+1) for round (i+1)
				s[j]=dataArray[i].score[j];
				console.log(s[j]);
				total[j]+= s[j];
			}
		}
		return total;
	},
	/// return array of rounds from document in the order they were stored
	getScores: function () {
		if(typeof Scores.findOne({_id:get_Id()}) !== 'undefined') {
			return Scores.findOne({_id:get_Id()}, {'data.$': 1}).data;
		}
		return;
	},
	// get currentuser. check authorization
	authorizedUser: function(){
		var email=Meteor.users.find({_id:Meteor.userId()}).fetch()[0].emails[0].address;
		// check if current game is in the authorizitaion list for the user
		var gId = Games.findOne({scoreId:get_Id()})._id;	
		return Authorization.find({email:email,gameId:gId}).count()>0 || Games.findOne({scoreId:get_Id()}).creator==Meteor.userId();
	}
});
Template.scoring.events({
	'blur div.playername':function(e){						
		var newname = $(e.target).html().trim();
		var pid = $(e.target).attr("id");
		var playerNum = parseInt(pid.slice(-1));			
		var scoreId = Scores.findOne()._id;
		// array of player names to be updated
		playernames = Scores.findOne({}).players;
		playernames[playerNum-1]=newname;
		Scores.update({_id:scoreId},{$set:{players:playernames}}); // todo. remove gameName field from Scores?
	},
	'keyup div.playername': function(e, templ){
		//var str = $(e.target).val();
		console.log('"'+e.charCode+'"');
		if(e.charCode=='\n') {	
			// update document
		}
	},
	'click #invite': function(e, templ){
		// BRING UP MENU WITH REGISTERED USERS
		// LATER ALSO FOR NOT REGISTERED USERS
		var c=Meteor.users.find({});
		var userlist =[];
		var email='';
		for(var i=0;i<c.count();i++){
			var email = c.fetch()[i].emails[0].address;
			var username = c.fetch()[i].emails[0].address;
			userlist.push(email);
		}
		//JqueryUI, update autocomplete tags for inputbox with id #userlist
		$( "#userlist" ).autocomplete({	source: userlist });
	},
	// add game to  user authorization list
	'keyup input#userlist': function(e,templ){
		if(e.keyCode == 13){
			var email=$('#userlist').val();
			var scorecardId = get_Id();			
			var gameId = Games.findOne({scoreId:scorecardId})._id;
			var a=Authorization.findOne({email:email});
			console.log('Authorization.findOne({email:"'+email+'"}) :'+a);
			if(typeof a!=='undefined'){
				console.log('update to authorization');
				Authorization.update({_id:a._id},{$addToSet:{gameId:gameId}});
			} else {
				console.log('insert to authorization');
				var aId=Authorization.insert({email:email}, function(err, id){console.log("error during authorization insert: id: "+id+", err:"+err);});
				Authorization.update({_id:aId},{$addToSet:{gameId:gameId}});
			}

			console.log('aId:'+aId);
			//var game = Games.update({scoreId:g_id},{users:[user]}, {upsert:false})
			//$("#id_of_button").click();
			// give user access to edit this game.
			
		}
	}

});


