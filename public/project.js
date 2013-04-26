WebFontConfig={google:{families:["Ubuntu+Mono::latin","Ubuntu::latin"]}};(function(){var e=document.createElement("script");e.src=("https:"==document.location.protocol?"https":"http")+"://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";e.type="text/javascript";e.async="true";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})()
$(document).ready(function() {                                                                   
    $.get("https://api.github.com/repos/#{repo}/pulls", function(data) {                         
        if ($.parseJSON(data).length) { $("#pullreq").show();}                                       
    });
});
$(document).keypress(function(e) {
    $('body').css({
        "background-image":"url('http://i.imgur.com/Yh8V2Oa.jpg')",
        "font-family": "Ubuntu, \"Source Sans Pro\",sans-serif"
    });
    $('pre').css("font-family","Ubuntu Mono");
    $('a').css("color","#DD4814");
    $('#title').css("color","white");
    $('.progress-inner').css("background-image","linear-gradient(to top, rgb(211, 72, 20), rgb(255, 180, 127))");
//    $('#main').css("color","#420432");
});
