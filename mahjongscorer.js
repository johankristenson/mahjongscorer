//todo
// kunna ta bort en inlagd rad
// berakna trolig scor for ovriga spelare pa en rad baserat pa inmatade varden nar winner och loser ar iklickade ska det racka att fylla i vardet pa ett stalle.
// Done:
// rev17 > fix Template.scoring.getPlayerArray, see http://stackoverflow.com/questions/9544391/mustache-or-handlebars-iterating-over-two-lists needed to have editable divs for the player names with dynamic ids using each getPlayerArray instead of each getPlayerNameArray

// {player1:"Oscar", player2:"Thomas K",player3:"johan k",player4:'Daniel U',GameDate: "2014-05-14 10:00",  {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }
// {gameId, gameName, player1:"Oscar", player2:"Thomas K",player3:"johan k",player4:'Daniel U', GameDate: "2014-05-14 10:00", {rounds: {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }}
// {gameId, gameName, players:{"Oscar", "Thomas K","johan k",'Daniel U'}, GameDate: "2014-05-14 10:00", {rounds: {round:1, player1score:-1,player2score:1,player3score:0,player4score:0}, {round:2, player1score:-1,player2score:1,player3score:0,player4score:0} }}
Scores = new Meteor.Collection("scores"); 
Games = new Meteor.Collection("games"); 
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

// todo. get and set game id to store as column next to round for the scores and for the players.
if (Meteor.isClient) {
	var triggerScoreInput = new Deps.Dependency;
/*	var showMahjongScorecard=false;
	var showMahjongScorecardTrigger = new Deps.Dependency;			
*/
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
		}
	});
	// return game names and ids
	Template.loadgames.listgamestoload = function() {
		return Games.find({},{scoreId:1,gameName:1});
	};

/*	Template.scoring.getPlayerNum = function() {
		var ret = [1,2,3,4,5];
		// no scoreboard
		if (typeof Scores === 'undefined' || typeof Scores.findOne() === 'undefined') {
			return 0;
		}
		var p = Scores.findOne({});
		ret = ret.slice(0, p.players.length);
		console.log("numplayers: "+ret.length);
		return ret;
	};*/
	/// return array of players and their start order
	Template.scoring.getPlayerNames = function(){
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
	
	Template.scoring.hasActiveScoreboard = function() {
		return Scores.find({}).count()==1;
	};
	// sum player score for any player
	// todo. how to access variable in local context using a string.
	Template.scoring.playerSum = function(toRound){
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
	};

	/// return array of rounds from document in the order they were stored
	Template.scoring.getScores = function () {
		if(typeof Scores.findOne({_id:get_Id()}) !== 'undefined') {
			return Scores.findOne({_id:get_Id()}, {'data.$': 1}).data;
		}
		return;
	};
	
	var risktakerNumTrigger = -1;
	// cellNumber: -1	=> true for risktakerNumTrigger >=0 (ie, a risktaker has been set)
	// cellNumber: >=0	=> true for risktakerNumTrigger == cellNumbe (ie, player=risktaker)
//	Template.scoring.enterScoreEnabled = function(cellNumber) {
	Template.scoring.enterScoreEnabled = function() {
		return risktakerNumTrigger>=0;
		/*if(cellNumber >= 0){
			triggerScoreInput.depend();
			return cellNumber==risktakerNumTrigger;
 		} else {
			return risktakerNumTrigger>=0;
		}*/
	};

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
			return 0;
		}
		var rounds = dataarray.length;
		return rounds;
	};

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
		g_id = Scores.insert({gameName: gname, players:gplayers, data:[]}, function(err, id){console.log("error insert: id of scores.insert: "+id+"   "+err);});
		Games.insert({gameName: gname, scoreId:g_id},function(err, id){console.log("error insert: id of Games.insert: "+id+"   "+err);});
		// change session variable to trigger subscription change using Meteor.autorun
		Session.set("SubscribeToId",g_id);
		
		console.log("inserting gameName:"+gname+", players: "+gplayers+" _id: "+g_id);
		//listOngoingGameIds();
	};
	
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

	// distribute the entered score	
	var distributeHandPoints = function(){
		var basescore=parseInt($('input#handscore').val());
		// risktaker and winner must be selected first to help score distribution
		var win = $("input[name=winner]:checked");
		var risk = $("input[name=risktaker]:checked");
		if((basescore>0 || basescore<0) && win!=='undefined' && risk!=='undefined'){
			console.log('distributing base score: %s',basescore);
			var winnernum = win.attr("id").slice(-1);
			var risktakernum = risk.attr("id").slice(-1);
			var winnerscore=0;
			var risktakerscore=0;			
			var playerscore=0;
			var numPlayers = Scores.findOne({}).players.length;
			if (risktakernum==winnernum) {
				if (basescore>=0) {
					// selfdraw
					winnerscore= (8+basescore)*numPlayers;
					playerscore= -(8+basescore);
				} else {
					// penalty. "winner" is penalized for wrong mahjong or similar.
					winnerscore= (basescore)*numPlayers;
					playerscore= -(basescore);
				}
			} else {
				// normal scoring hand. no selfdraw or false mahjong.
				winnerscore = basescore + 8*numPlayers;
				risktakerscore= -(8+basescore);
				playerscore= -8;
			}				
	
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
	};
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
				// add calc of score per player based on hand score and risktaker/winner here.
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
//				console.log("round "+r);
//				console.log('document _id :'+get_Id());
				// add an array of players scores to the data holder
				Scores.update(
					{ _id: get_Id() },
					{ $push: {data: { winner: winner, risktaker:risktaker, round:r, score: playerScore  } }}
				);
				// uncheck radiobuttons
				$("input[name=winner]:checked").prop('checked', false);
				$("input[name=risktaker]:checked").prop('checked', false);
			} else {
				console.log('error : score must balance. ('+totalScore+') does not.');
				alert('score must balance. ('+totalScore+') does not.');
			}
		},
		'keyup handscore.score': function(e, templ){
			// remove last entered character if the string is no longer a valid number
			// enter hand value of winner (negative value in case of falsely declaring mahjong)
			var str = $(e.target).val();
			// only allow numbers in the input field
			if(str!='-' && !isNumber(str) ) {	
				//console.log('not a nubmer '+str);
				$(e.target).val(str.substring(0, str.length-1));
			}
			// distribute the score
			distributeHandPoints();
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
			console.log('clicked thumbnail. trigger: %s',showMahjongScorecard);			
		},
		'keyup div.playername': function(e, templ){
			//var str = $(e.target).val();
			console.log('"'+e.charCode+'"');
			if(e.charCode=='\n') {	
				// update document
			}
		}

	});
	
}

if (Meteor.isServer) {
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
	});
}
