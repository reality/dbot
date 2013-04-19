var exec = require('child_process').exec,
    request = require('request'),
    _ = require('underscore');

var pages = function(dbot) {
    var quoteCat = dbot.db.quoteArrs[dbot.config.name],
        rev, diff, branch;

    exec("git rev-list --all | wc -l", function(error, stdout, stderr) {
        rev = stdout
    });
    exec("git rev-parse --abbrev-ref HEAD", function(error, stdout, stderr) {
        branch = stdout
    });
    exec("git log -1", function(error, stdout, stderr) {
        diff = stdout
    });
    var configList = [];
    if(_.has(dbot.modules,'dent')){
        configList.push(dbot.t("dent-account", {
            "username": dbot.config.dent.username
        }));
        if(dbot.config.dent.dentQuotes) {
            configList.push(dbot.t("dent-push"));
        }
    }
    if(_.has(dbot.modules,'link')){
        if(dbot.config.link.autoTitle){
            configList.push(dbot.t("link-autotitle"));
        }
    }
    if(_.has(dbot.modules,'quotes')){
        configList.push(dbot.t("quote-rmlimit", {
            "limit": dbot.config.quotes.rmLimit
        }));
    }
    if(_.has(dbot.modules,'report')){
        if(dbot.config.report.notifyVoice){
            configList.push(dbot.t("report-notifyvoice"));
        }
    } 
    if(_.has(dbot.modules,'web')){
        configList.push(dbot.t("web-port", {
            "port": dbot.config.web.webPort
        }));
    }
       
        
               
   
    /* TODO: merge back into github module */
    var milestones;
    request("https://api.github.com/repos/" + dbot.config.github.defaultrepo + "/milestones?state=open", function(error, response, body){
        milestones = JSON.parse(body);
    });


    return {
        '/project': function(req, res) {
            var quote = dbot.config.name;
            if(quoteCat) {
                quote = quoteCat[Math.floor(Math.random()*quoteCat.length)];
            }

            res.render('project', {
                "configList": configList,
                "name": dbot.config.name,
                "intro": dbot.t("dbotintro", {
                    "botname": dbot.config.name
                }),
                "curr839": dbot.config.language,
                "repo": dbot.config.github.defaultrepo,
                "branch": dbot.t("branch",{
                    "branch": branch
                }),
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
                    "rev": rev
                }),
                "modules": dbot.config.moduleNames,
                "loadmod": dbot.t("loadedmodules"),
                "debugmode": dbot.t("debugmode-" + dbot.config.debugMode),
                "milestones": milestones,
                "milestoneprog": dbot.t("milestoneprog"),
                "config": dbot.t("configoptions"),
                "milestonename": dbot.t("milestonename"),
                "openmilestone": dbot.t("openmilestone"),
                "closedmilestone": dbot.t("closedmilestone"),
                "development": dbot.t("development"),
                "dquote": quote,
                "diff": diff,
                "pagetitle": dbot.t("pagetitle", {
                    "botname": dbot.config.name
                }),
                "git": dbot.t("git"),
                "milestonehead": dbot.t("milestones"),
                "propaganda": dbot.t("propaganda")
           });
        },
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
