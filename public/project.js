$(document).ready(function() {                                                                   
    $.get("https://api.github.com/repos/#{repo}/pulls", function(data) {                         
        if ($.parseJSON(data).length) { $("#pullreq").show();}                                       
    });
});
$(document).keypress(function(e) {
WebFontConfig={google:{families:["Ubuntu::latin"]}};(function(){var e=document.createElement("script");e.src=("https:"==document.location.protocol?"https":"http")+"://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";e.type="text/javascript";e.async="true";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})()
    $('body').css({
        "background-image":"url('http://i.imgur.com/Yh8V2Oa.jpg')",
        "font-family": "Ubuntu, \"Source Sans Pro\",sans-serif"
    });
    $('a').css("color","#DD4814");
    $('#title').css("color","white");
    $('#main').css("border-color","#420432");
});
