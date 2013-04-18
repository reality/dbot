var exec = require('child_process').exec;

var pages = function(dbot) {
    var lang = dbot.config.language;
    /*
    var modules = function() {
        var modlist = dbot.config.moduleNames;
        var formatted = "<ul>"
        for (var i = 0, i < modlist.length; i++) {
            formatted += "<li>" + modlist[i] + "</li>;
        }
        formatted += "</ul>"
        return formatted;
    } */
    var rev;
    exec("git rev-list --all | wc -l", function(a,b,c){rev = b});
    return {
        '/project': function(req, res) {
            res.render('project', {
                "name": dbot.config.name,
                "curr839": lang,
                "currver": dbot.config.version,
                "currlang": dbot.strings["dbotspeaks"][lang].format({ // dbot.t won't work s;
                    "lang839": lang,
                    "langen": dbot.strings[lang]["en"],
                    "lang": dbot.strings[lang][lang],
                    "name": dbot.config.name
                }),
                "projectstatus": dbot.strings["projectstatus"][lang],
                "revnum": dbot.strings["revnum"][lang].format({
                    "name": dbot.config.name,
                    "rev": rev,
                    "ver": "abcdef" // TODO, obviously
                }),
                "modules": dbot.config.moduleNames,
                "loadmod": dbot.strings["loadedmodules"][lang]
           });
        },
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
