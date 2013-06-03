var exec = require('child_process').exec,
    request = require('request'),
    _ = require('underscore');

var pages = function(dbot) {
    var quoteCat = dbot.db.quoteArrs[dbot.config.name],
        rev, diff, branch, credit, authors = [];
    exec("git log --format='%cN¬' | sort -u | tr -d '\n'", function (error, stdout, sderr) {
        var credit = stdout.split("¬"); // nobody uses ¬, do they?
        for (var i = 0; i < credit.length; i++) {     
            if ((credit[i].split(" ").length) == 2){ 
                console.log(credit[i]);
                authors.push(credit[i]);          
            }                                    
        }
    });

    exec("git rev-list --all | wc -l", function(error, stdout, stderr) {
       rev = stdout;
    });

    exec("git rev-parse --abbrev-ref HEAD", function(error, stdout, stderr) {
        branch = stdout
    });


    exec("git log -1", function(error, stdout, stderr) {
        diff = stdout
    });   

    /* TODO: merge back into github module */
    var milestones;
    request({"url":"https://api.github.com/repos/" + dbot.config.modules.github.defaultrepo + "/milestones?state=open","headers":{"User-Agent":"reality/depressionbot (project module)"}}, function(error, response, body){
        milestones = JSON.parse(body);
    });


    return {
        '/project': function(req, res) {
            var quote = dbot.config.name;
            if(quoteCat) {
                quote = quoteCat[Math.floor(Math.random()*quoteCat.length)];
            }

            res.render('project', {
                "translation": dbot.modules.project.api.translationProgress(),
                "configList": dbot.modules.project.api.configList(), 
                "authors": authors,
                "credits": dbot.t("credits"),
                "thanks": dbot.t("thanks"),
                "name": dbot.config.name,
                "intro": dbot.t("dbotintro", {
                    "botname": dbot.config.name
                }),
                "curr839": dbot.config.language,
                "repo": dbot.config.modules.github.defaultrepo,
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
                "propaganda": dbot.t("propaganda"),
                "languagecurr": dbot.t(dbot.config.language),
                "languagenati": dbot.t("langhead-native"),
                "languageeng": dbot.t("en"),
                "languageprog": dbot.t("langhead-progress"),
                "languagetrans": dbot.t("langhead-translations"),
                "languagetranshead": dbot.t("translations"),
                "pullreqs": dbot.t("outstanding-pullreq")
           });
        },
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
