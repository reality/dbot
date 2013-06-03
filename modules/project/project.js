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
                    "username": dbot.config.modules.dent.username
                }));
                if(_.has(dbot.config.modules.dent.dentQuotes)) {
                    list.push(dbot.t("dent-push"));
                }
            }
            if(_.has(dbot.modules,'link')){
                if(dbot.config.modules.link.autoTitle){
                    list.push(dbot.t("link-autotitle"));
                }
            }
            if(_.has(dbot.modules,'quotes')){
                list.push(dbot.t("quote-rmlimit", {
                    "limit": dbot.config.modules.quotes.rmLimit
                }));
            }
            if(_.has(dbot.modules,'report')){
                if(dbot.config.modules.report.notifyVoice){
                    list.push(dbot.t("report-notifyvoice"));
                }
            } 
            if(_.has(dbot.modules,'web')){
                list.push(dbot.t("web-port", {
                    "port": dbot.config.modules.web.webPort
                }));
            }
            return list;
        },
        'translationProgress' : function(callback){
            var translation = [] ;
            var str = _.values(dbot.strings);
            for (var i = 0; i < str.length; i++){
               var cur = _.keys(str[i]);
               for (var j = 0; j < cur.length; j++) {
                   translation = translation.concat(cur[j]);
               }
            }
            var t = {};
            for (var k = 0; k < translation.length; k++) {
                var curr = translation[k];
                if (t[curr]) {
                    t[curr]["count"] += 1;
                } else {
                    t[curr] = {};
                    t[curr]["iso"] = curr;
                    t[curr]["count"] = 1;
                    t[curr]["own"] = dbot.strings[curr][curr];
                    t[curr]["local"] = dbot.t(curr);
                    t[curr]["english"] = dbot.strings[curr]["en"];
                }
            }
            console.log(t);
            return t;
        }
    };   
    this.api['translationProgress'].external = true;
};        

exports.fetch = function(dbot){
    return new project(dbot);
};
