/**
 * Module Name: wordcrimes
 * Description: wordgame and ting
 */
var fs = require('fs'),
    _ = require('underscore')._;

var wordcrimes = function(dbot) {
    this.game = null;

    this.commands = {
        '~startgame': function(event) {
            if(!this.game && _.include(this.config.allowed_chans, event.channel.name)) {
                event.reply('WORD GAME STARTING IN 5 SECONDS');
                setTimeout(function() {
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
                        'channel': event.channel.name,
                        'found': [],
                        'scores': {}
                    };

                    if(puzzle.type === 'start') {
                        event.reply('NAME ALL THE WORDS YOU CAN THINK OF THAT START WITH ' + puzzle.part);
                    } else if(puzzle.type === 'end') {
                        event.reply('NAME ALL THE WORDS YOU CAN THINK OF THAT END IN ' + puzzle.part);
                    }

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
                    }.bind(this), 40000);
                }.bind(this), 5000);
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
