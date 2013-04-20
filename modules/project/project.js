/**
 * Module Name: Project
 * Description: Web page which shows git status and other various stats about
 * the dbot.
 */

_ = require('underscore'),
  exec = require('child_process').exec;

var project = function(dbot) {

    this.onLoad = function() {
        var configList = function(){
            var list = [];
            if(_.has(dbot.modules,'dent')){
                 configList.push(dbot.t("dent-account", {
                    "username": dbot.config.dent.username
                }));
            }
            if(dbot.config.dent.dentQuotes) {
                configList.push(dbot.t("dent-push"));
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
            return list;
        }.bind(this);
    }.bind(this);
}   
        
exports.fetch = function(dbot){
    return new project(dbot);
}
