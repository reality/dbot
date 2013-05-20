function giveMessage(msg) {
    $('<li>'+msg+'</li>').prependTo('#history').hide().slideDown();
}

var lock = false;
var highscore = 10 + 1;
var score = highscore;
var count = 0;
var count2 = 0;

$('#count').text(score);

function getNewImage() {
    count += 1;
    lock = true;
    $('#loading').fadeIn();
    $('#loading').text('Loading image ' + count + '...');
    document.title = 'random imgur (' + count + ')';
    $('#loading').fadeIn();
    $('#image').load(function(){});
    $.get("/api/imgur/getRandomImage", function(d) {
        $('#image').attr('src', d.data[0]);
        lock = false;
        score -= 1;
        $('#count').text(score);
        $('#details').text("Fetching info...");
        giveMessage('<a href="' + d.data[0] + '">' + d.data[0] + '</a>');
        $.get("/api/imgur/getImageInfoString", { 'slug': d.data[1] }, function(info) {
            if(info.data[0].indexOf('undefined') == -1) {
                $("#details").text(count + ': ' + info.data[0]);
                $('#details').show();
            } else {
                $("#details").hide();
            }
            $('#loading').fadeOut();
        }, "json");
        console.log(d.data[2]);
        if(d.data[2] == "e49e686582ce3f60cb51d00c10924861") { // 3Tt6N fb guy
            count2 += 1;
            if (count2 == 1){
                $('#count2').text("+ " + count2 + " Facebook Monopoly Man");
            } else {
                $('#count2').text("+ " + count2 + " Facebook Monopoly Men");
            }
            $('#count2').fadeIn();
        }
    }, "json");
}

$(getNewImage());

var t;
$(document).on('keydown', function(e){
    switch(e.which){
        case 82: // r
        score = highscore;
        $('#count').text(highscore);
        giveMessage("Score reset.");
    case 13: // enter
    case 32: // space
        if (lock) {
            $('#loading').text(function(index, text){
                return text.replace(/.(?=[^.]*$)/, "!");
            });
        } else {
            getNewImage();
        }
        break;
    case 67:
        $('#count').fadeToggle();
        $('#count2').fadeToggle();
        break;
    case 83: // s
        $('body').toggleClass('crop');
        giveMessage("Toggled scrollbars.")
        break;
    case 190: // .
        if(!t){
            giveMessage("Automation on.");
            $('#loading').css("font-style", "italic");
            $('#loading').css("color","#BF2527");
            t = setInterval(function(){
                getNewImage();
            },5000);
        } else {
            giveMessage("Automation off.");
            $('#loading').css("font-style","normal");
            $('#loading').css("color","#85BF25");
            clearTimeout(t);
            t = undefined;
        }
    };
});
