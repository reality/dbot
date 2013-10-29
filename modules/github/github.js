/**
 * Module Name: Github 
 * Description: Retrieves interesting Github information
 */
var request = require('request'),
    exec = require('child_process').exec;

var github = function(dbot) {
    this.api = {
        "githubStatus": function(callback){
            var reqUrl = "https://status.github.com/api/last-message.json";
            request({"url": reqUrl, "headers": {"User-Agent": this.config.useragent}}, function(error, response, body) {
                callback(JSON.parse(body));
            });
        }
    };


    var commands = {
        '~repocount': function(event) {
            var reqUrl = "https://api.github.com/users/" + event.params[1] + "/repos";
            request({"url": reqUrl, "headers": {"User-Agent": this.config.useragent}}, function(error, response, body) {
                if(response.statusCode == "200") {
                    var result = JSON.parse(body);
                    event.reply(dbot.t("repocount",{"user": event.params[1], "count": result.length}));
                } else {
                    event.reply(dbot.t("usernotfound"));
               }
           });
        },
        '~repo': function(event) {
            var repo = event.params[1];
            if (typeof repo == 'undefined') {
                repo = this.config.defaultrepo;
            }

            var reqUrl = "https://api.github.com/";
            reqUrl += "repos/" + repo;
            request({"url": reqUrl, "headers": {"User-Agent": this.config.useragent}}, function(error, response, body) {

                var data = JSON.parse(body);
                if (data["fork"]) {
                   event.reply(dbot.t("forkedrepo",data)); 
                } else {
                    event.reply(dbot.t("unforkedrepo",data));
                }
                // TODO: move this shizz into an api call
                var longurl = "http://github.com/" + repo;
                request({method: 'POST', uri: 'http://git.io', form:{url: longurl}}, function(error, response, body){
                    event.reply(dbot.t('location')+" "+response.headers["location"]);
                });
            });
        }, 
        '~gstatus': function(event) {
            data = this.api.githubStatus(function(data){
                console.log(data);
                event.reply(dbot.t("status"+data["status"]));
                event.reply(data["body"]);
            }.bind(this));
        },
        '~milestone': function(event) {
            var repo = this.config.defaultrepo; 
            var name = event.params[1];
            if (event.params[2]){
                repo = name;
                name = event.params[2];
            }
            var reqUrl = "https://api.github.com/repos/";
            reqUrl += repo + "/milestones";

            request({"url": reqUrl, "headers":{"User-Agent": this.config.useragent}}, function(error, response, body) {
                var data = JSON.parse(body);
                for (var section in data) {
                    var milestone = data[section];
                    if (milestone["title"] == name){
                        var str = "Milestone " + milestone["title"];
                        var progress = milestone["closed_issues"] / (milestone["open_issues"] + milestone["closed_issues"]);
                        progress = Math.round(progress*100);
                        var bar = "[";
                        for (var i = 10; i < 100; i += 10) {
                            if  ((progress/i) > 1) {
                                bar += "█";
                            } else {
                                bar += " ";
                            }
                        }
                        bar += "]";
                        str += " is " + bar + progress + "% complete";

                        var longurl = "http://github.com/" + repo + "/issues?milestone=" + milestone["number"];
                        request({method: 'POST', uri: 'http://git.io', form:{url: longurl}}, function(error, response, body){
                            event.reply(response.headers["location"]);
                        });
                        event.reply(str);
                        break;
                    }
                }
           });
        }, 
        '~repocount': function(event) {
        // TODO: add handling for non existent user
            var reqUrl = "https://api.github.com/users/" + event.params[1] + "/repos";
            request({"url": reqUrl,"headers": { "User-Agent": this.config.useragent}}, function(error, response, body) {
            var result = JSON.parse(body);
            event.reply(event.params[1] + " has " + result.length + " public repositories.");
            });
        },
        '~grate': function(event) {
            request.get({"url":"https://api.github.com/rate_limit", "headers":{"User-Agent": this.config.useragent}}, function(error, response, body) {
                var data = JSON.parse(body);
                if (data.message){
                    event.reply(data.message);
                } else {
                    event.reply(data.rate.remaining + " requests of " + data.rate.limit + " remaining.");
                }
            });
        },
        '~issue': function(event) {
            var repo, issue, randflag;
            if (isNaN(event.params[1]) && event.params[1]){ // if ~issue foo/bar
                repo = event.params[1];
                issue = event.params[2];
            } else {
                repo = this.config.defaultrepo;
                issue = event.params[1];
            }

            if (issue == "*" || issue == "random" || issue == "0") {
                issue = "";
                randflag = true;
            } else if (!issue) { // issue is undefined
                issue = "";
            } else {
                issue = "/" + issue; // got to be a better way
            }
            
            var reqUrl = "https://api.github.com/repos/" + repo + "/issues" +
                issue + "?sort=" + this.config.sortorder;
            request.get({"url": reqUrl, headers: { "User-Agent": this.config.useragent}}, function(error,response, body) {
                if (response.statusCode == "200") {
                    var data = JSON.parse(body);
                    if (!issue){
                        if (randflag) {
                            data = data[Math.floor(Math.random() * data.length)];
                        } else {
                            data = data[0];
                        }
                    }
                    if (data["pull_request"]["html_url"]){
                        console.log(data["pull_request"]["html_url"]);
                        data["pull_request"] = " with code";
                    } else {
                        data["pull_request"] = "";
                    }
                    if (data["state"]=="open") {
                        data["state"] = "\u000303" + data["state"];
                    } else {
                        data["state"] = "\u000304" + data["state"];
                    }
                    var labels = "";
                    for (var i=0; i < data["labels"].length; i++) { // for-in doesn't like me
                        var color = "\u0003" + (parseInt(data["labels"][i]["color"],16) % 15);
                        labels += " " + color + data["labels"][i]["name"];
                    }
                    data["label"] = labels;
                    event.reply(dbot.t("issue",data));
                    event.reply(data["html_url"]);
                } else {
                    event.reply(dbot.t("issuenotfound"));
                }
            });
       },
       '~commits': function(event) {
            exec("git rev-list --all | wc -l", function(error, stdout, stderr) {
                stdout = stdout.trim();
                request({"url":"http://numbersapi.com/" + stdout + "?fragment&default=XXX"}, function(error, response, body){
                    if (body != "XXX"){
                        event.reply(dbot.t("commitcountfun",{"fact": body, "count": stdout}));
                    } else {
                        // nothing fun about the number, let's try the year
                        request({"url":"http://numbersapi.com/" + stdout + "/year?fragment&default=XXX"}, function(error, response, body){
                            if (body != "XXX"){
                                event.reply(dbot.t("commitcountyear",{"fact": body, "count": stdout}));
                            } else {
                                event.reply(dbot.t("commitcountboring",{"count": stdout}));
                            }
                        });
                    }
               });
            });
        }
    };
    this.commands = commands;

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new github(dbot);
};
