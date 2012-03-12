// let's fetch us some goddamn API
var apiEmbed = document.createElement('script');
apiEmbed.src = 'http://www.youtube.com/player_api';
document.getElementsByTagName('script')[0].parentNode.insertBefore(apiEmbed, document.getElementsByTagName('script')[0]);

// this will be called by the player API when it's finished downloading
function onYouTubePlayerAPIReady() {
    var youTubePlaceholders = document.getElementsByClassName('ytplaceholder');
    for(var i = 0; i < youTubePlaceholders.length; i++) {
        var videoURL = youTubePlaceholders[i].innerText;
        var videoIDMaybe = videoURL.match(/[?&]v=([A-Za-z0-9\-_]+)(?:[?&]|$)/);
        youTubePlaceholders[i].innerText = '';
        if(videoIDMaybe) {
            var ytVideoID = videoIDMaybe[1];
            var player = new YT.Player(youTubePlaceholders[i], {
                height: '290',
                width: '480',
                videoId: ytVideoID
            });
        }
    }
}
