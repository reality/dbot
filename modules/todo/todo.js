var _ = require('underscore')._;

var todo = function(dbot) {
    if(!_.has(dbot.db, 'todos')) {
        dbot.db.todos = {};
    }

    var todos = dbot.db.todos;

    this.api = {
        'getTodos': user => 
            _.has(todos,user) ? todos[user] : [],

        'addTodo': (user, entry) => {
            if (!_.has(todos,user)) {
                todos[user] = [];
            }
            todos[user].push(entry);
            return todos[user].length;
        },

        // entryNum is 1-based
        // if entryNum is falsy then this will return a random todo.
        'getTodo': (user, entryNum) => {
            if (!_.has(todos,user)) return false;
            if (!entryNum) {
                entryNum = Math.floor(Math.random() * todos[user].length) + 1;
            }
            if (entryNum > todos[user].length) return false;
            if(entryNum < 1) return false;
            return {
                todoNum: entryNum,
                todo: todos[user][entryNum - 1]
            };
        },

        // entryNum is 1-based
        'delTodo': (user, entryNum) => {
            if (!_.has(todos,user)) return false;
            if (entryNum > todos[user].length) return false;
            if (entryNum < 1) return false;
            todos[user].splice(entryNum-1, 1);
            return true;
        }
    }

    this.commands = {
        'todo': evt => {
            var user = evt.rUser.id;
            var myTodos = this.api.getTodos(user);
            if(myTodos.length == 0) {
                evt.reply(dbot.t('empty-list', {'user': evt.user}));
            } else {
                evt.reply('[' + evt.user + ']:');
                var i = 0;

                function loop() {
                    var todo = myTodos[i];
                    evt.reply((i + 1) + ': ' + todo);
                    i = i + 1;
                    if (i < myTodos.length) setTimeout(loop, 1000);
                }

                loop();
            }
        },

        'todoadd': evt => {
            var user = evt.rUser.id;
            var todoNum = this.api.addTodo(user, evt.input[1]);
            evt.reply(dbot.t('added', { 'user': evt.user, 'entry-number': todoNum, 'entry': evt.input[1]}));
        },

        'tododone': evt => {
            var user = evt.rUser.id;
            var todoNum = parseInt(evt.input[1]);
            var todo = this.api.getTodo(user, todoNum);
            if(!todo) {
                evt.reply(dbot.t('no-entry', { 'user': evt.user, 'entry-number': todoNum}));
            } else {
                this.api.delTodo(user, todoNum);
                evt.reply(dbot.t('marked-complete', { 'user': evt.user, 'entry-number': todo.todoNum, 'entry': todo.todo}));
            }
        }
    }

    this.commands.todoadd.regex = [/todoadd (.+)/, 2];
    this.commands.tododone.regex = [/tododone (\d+)/, 2];
}

exports.fetch = function(dbot) {
    return new todo(dbot);
}