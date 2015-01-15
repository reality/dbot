/**
 * Module Name: wordcrimes
 * Description: wordgame and ting
 */
var fs = require('fs'),
    _ = require('underscore')._;

var wordcrimes = function(dbot) {
    this.game = null;

    this.internalAPI = {
        'createPuzzle': function(channel) {
 //           if(_.random(0, 3) === 1) {
                return this.internalAPI.createAnagramPuzzle(channel);
  //          }

            var puzzle = this.puzzles[_.random(0, this.puzzles.length -1)],
                solutions = _.filter(this.dict, function(word) {
                    if(puzzle.type === 'start') {
                        return word.match('^' + puzzle.part);
                    } else if(puzzle.type === 'end') {
                        return word.match(puzzle.part + '$');
                    }
                });

            this.game = {
                'puzzle': puzzle,
                'solutions': solutions,
                'channel': channel,
                'found': [],
                'scores': {}
            };

            return true;
        }.bind(this),

        'createAnagramPuzzle': function(channel) {
            var randomV = function(len) {
                var chars = "aeiou";
                return len ? chars.charAt(~~(Math.random()*chars.length)) + randomV(len-1) : "";
            };
            var randomC = function(len) {
                var chars = "bcdfghklmnpqrstvwxyz";
                return len ? chars.charAt(~~(Math.random()*chars.length)) + randomC(len-1) : "";
            };
            var puzzle = {
                'type': 'anagram',
                'part': (randomV(3) + randomC(6)).split('').sort(function(){return 0.5-Math.random();}).join('')
            };

            var partArr = puzzle.part.split(''),
                solutions = _.filter(this.dict, function(word) {
                    return (word.length > 1 && _.difference(word.split(''), partArr).length === 0); 
                });

            if(solutions.length < 30) {
                return this.internalAPI.createAnagramPuzzle(channel); 
            }

            this.game = {
                'puzzle': puzzle,
                'solutions': solutions,
                'channel': channel,
                'found': [],
                'scores': {}
            };

            return true;

        }.bind(this)
    };

    this.commands = {
        '~startgame': function(event) {
            if(_.isNull(this.game) && _.include(this.config.allowed_chans, event.channel.name)) {
                this.game = {};
                event.reply('WORD GAME STARTING IN 5 SECONDS');
                setTimeout(function() {
                    this.internalAPI.createPuzzle(event.channel.name); 
                    
                    var game = this.game;

                    if(game.puzzle.type === 'start') {
                        event.reply('NAME ALL THE WORDS YOU CAN THINK OF THAT START WITH ' + game.puzzle.part);
                    } else if(game.puzzle.type === 'end') {
                        event.reply('NAME ALL THE WORDS YOU CAN THINK OF THAT END IN ' + game.puzzle.part);
                    } else if(game.puzzle.type === 'anagram') {
                        event.reply('NAME ALL THE ANAGRAMS OF ' + game.puzzle.part);
                    }

                   /* setTimeout(function() {
                        if(!_.isNull(this.game)) {
                            event.reply('30 SECONDS REMAINING');
                        }
                    }.bind(this), 30000);*/
                    setTimeout(function() {
                        if(!_.isNull(this.game)) {
                            event.reply('10 SECONDS REMAINING');
                        }
                    }.bind(this), 20000);
                    setTimeout(function() {
                        if(!_.isNull(this.game)) {
                            if(this.game.found.length > 0) {
                                var winner = _.invert(this.game.scores)[_.max(this.game.scores)];
                                event.reply('GAME OVER. THE WINNER IS ' + winner.toUpperCase() + ' WITH ' + this.game.scores[winner]);
                                event.reply(this.game.solutions.length - this.game.found.length + ' solutions remained.'); 
                            } else {
                                event.reply('NO SOLUTIONS FOUND. YOU ARE ALL RUBBISH.');
                            }
                            this.game = null;
                        }
                    }.bind(this), 30000);
                }.bind(this), 5000);
            } else {
                event.reply('GAME ALREADY RUNNING');
            }
        }
    };

    this.listener = function(event) {
        if(!_.isNull(this.game) && this.game.channel === event.channel.name) {
            if(_.include(this.game.solutions, event.message) && !_.include(this.game.found, event.message)) {
                if(!_.has(this.game.scores, event.user)) this.game.scores[event.user] = 0;
                this.game.scores[event.user]++;
                this.game.found.push(event.message);
                event.reply(event.user + ': ' + event.message.toUpperCase() + ' IS CORRECT. ' + 
                    this.game.found.length + '/' + this.game.solutions.length + ' WORDS FOUND');

                if(this.game.found.length === this.game.solutions.length) {
                    var winner = _.invert(this.game.scores)[_.max(this.game.scores)];
                    event.reply('ALL WORDS FOUND. THE WINNER IS ' + winner.toUpperCase() + ' WITH ' + this.game.scores[winner]);
                    this.game = null;
                }
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';

    this.onLoad = function() {
        this.puzzles = this.config.puzzles;
        this.dict = fs.readFileSync(this.config.dict).toString().split('\n');
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new wordcrimes(dbot);
};
