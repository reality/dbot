/**
 * Module Name: question
 * Description: Ask and answer questions. How delightful
 */
var _ = require('underscore')._;

var question = function(dbot) {
    if(!_.has(dbot.db, 'lastQuestion')) dbot.db.lastQuestion = 0;

    this.commands = {
        '~ask': function(event) {
            var id = dbot.db.lastQuestion;
            var question = {
                'id': id,
                'asker': event.rUser.id,
                'answerer': null,
                'status': false,
                'answer': null
            };
            this.db.save('questions', id, question, function() {
                dbot.db.lastQuestion++; 
                event.reply(dbot.t('q_asked', { 'id': id }));
            });
        },

        '~answer': function(event) {
            var id = event.input[1],
                answer = event.input[2];

            this.db.read('questions', id, function(err, question) {
                if(question) {
                    if(question.status != true) {
                        question.answerer = event.rUser.id;
                        question.answer = answer;
                        this.db.save('questions', question.id, question, function() {
                            event.reply(dbot.t('q_answered', { 'id': id }));  
                        });
                    } else {
                        event.reply(dbot.t('q_alreadyanswered', { 'id': id }));
                    }
                } else {
                    event.reply(dbot.t('q_noexist', { 'id': id }));
                }
            }.bind(this));
        },

        '~question': function(event) {
            var id = event.params[1]; 
            this.db.read('questions', id, function(err, question) {
                if(question) {
                    var response = {
                        'id': id,
                        'question': question.question,
                        'asker': question.asker
                    };
                    if(question.status == true) {
                        event.reply(dbot.t('q_answered', _.extend(response, {
                            'answerer': question.answerer,
                            'answer': question.answer
                        })));
                    } else {
                        event.reply(dbot.t('q_unanswered', response));
                    }
                } else {
                    event.reply(dbot.t('q_noexist', { 'id': id }));
                }
            });
        }
    };
    this.commands['~answer'].regex = [/^~answer ([^ ]+) (.+)$/, 3];
};

exports.fetch = function(dbot) {
    return new question(dbot);
};
