/**
 * Module Name: Project
 * Description: Web page which shows git status and other various stats about
 * the dbot.
 */

_ = require('underscore'),
  exec = require('child_process').exec;

var project = function(dbot) {

    this.api = {
        'configList' : function(callback){
            var list = [];
            if(_.has(dbot.modules,'dent')){
                 list.push(dbot.t("dent-account", {
                    "username": dbot.config.dent.username
                }));
            }
            if(_.has(dbot.config.dent.dentQuotes)) {
                list.push(dbot.t("dent-push"));
            }
            if(_.has(dbot.modules,'link')){
                if(dbot.config.link.autoTitle){
                    list.push(dbot.t("link-autotitle"));
                }
            }
            if(_.has(dbot.modules,'quotes')){
                list.push(dbot.t("quote-rmlimit", {
                    "limit": dbot.config.quotes.rmLimit
                }));
            }
            if(_.has(dbot.modules,'report')){
                if(dbot.config.report.notifyVoice){
                    list.push(dbot.t("report-notifyvoice"));
                }
            } 
            if(_.has(dbot.modules,'web')){
                list.push(dbot.t("web-port", {
                    "port": dbot.config.web.webPort
                }));
            }
            return list;
        },
        'getAuthors': function(callback) {
            var foo = ['a','b','c']; 
            exec("git rev-list --all | wc -l", function(error, stdout, stderr){ 
                foo.push(stdout);
            });
            callback(foo);
        }
    }   
}        

exports.fetch = function(dbot){
    return new project(dbot);
}
