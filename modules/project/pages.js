var exec = require('child_process').exec,
    request = require('request');

var pages = function(dbot) {
    var rev;
   exec("git rev-list --all | wc -l", function(a,b,c){rev = b});
    var gstatus;
    dbot.api.github.githubStatus(function(a){gstatus = a});
    
    /* TODO: merge back into github module */
    var milestones;
    request("https://api.github.com/repos/" + dbot.config.github.defaultrepo + "/milestones", function(e, r, b){
        milestones = JSON.parse(b);
    });


    return {
        '/project': function(req, res) {
            res.render('project', {
                "name": dbot.config.name,
                "curr839": dbot.config.language,
                "currver": dbot.config.version,
                "currlang": dbot.t("dbotspeaks",{
                    "lang839": dbot.config.language,
                    "langen": dbot.strings[dbot.config.language]["en"],
                    "lang": dbot.t(dbot.config.language),
                    "name": dbot.config.name
                }),
                "projectstatus": dbot.t("projectstatus"),
                "revnum": dbot.t("revnum",{
                    "name": dbot.config.name,
                    "rev": rev,
                    "ver": "abcdef" // TODO, obviously
                }),
                "modules": dbot.config.moduleNames,
                "loadmod": dbot.t("loadedmodules"),
                "debugmode": dbot.t("debugmode-" + dbot.config.debugMode),
                "githubstatus": gstatus,
                "milestones": milestones,
                "milestoneprog": dbot.t("milestoneprog"),
                "config": dbot.t("configoptions"),
                "milestonename": dbot.t("milestonename"),
                "openmilestone": dbot.t("openmilestone"),
                "closedmilestone": dbot.t("closedmilestone")
                 
           });
        },
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
