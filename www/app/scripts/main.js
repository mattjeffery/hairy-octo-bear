var wof = angular.module("wof",[]);

wof.run(["$rootScope","$timeout",function($rootScope,$timeout){
    $rootScope.doLater = function(fn){
        $timeout(function(){
            fn();
        },0);
    }
}]);

var MP3s = [
    "data/test0.mp3",
    "data/test1.mp3",
    "data/test2.mp3"
]

var token = "dd7bc0e50cdd4edca1f29af02f10e74f&_=1386421294382";

var MusicPlayer = function(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();

    window.context = this.context;
}

MusicPlayer.prototype.playList = function(list){
    var currentIndex = -1;
    var self = this;
    self.sourceQueue = [];

    var currentURL = 0;

    var loadSource = function(url){

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {

            self.context.decodeAudioData(request.response, function(buffer) {
                self.sourceQueue.push(buffer);
                if(self.sourceQueue.length == 1){
                    self.playWithSource(self.sourceQueue[0]);
                }
                currentURL += 1;

                if(list[currentURL])
                    loadSource(list[currentURL]);

            }, function(){
                console.log("ERROR DECODING FILE");
            });
        }
        request.send();
    }

    loadSource(list[currentURL])

   /*var doPlay = function(){
       currentIndex > -1 ? list[currentIndex].playing = false : false;
       currentIndex += 1;

       list[currentIndex].playing = true;
       var url = list[currentIndex].releasegroup["preview_url"];

       // load the souce in here

       console.log("PLAYING ",url);

       self.play(url).done(doPlay);
    }

    if(list.length > 0)
        doPlay();

    // start playing */
}

MusicPlayer.prototype.playWithSource = function(sData){

    var self = this;
    var FADE = 2000;

    var playSound = function (buffer) {
        var source = self.context.createBufferSource(); // creates a sound source

        var gainNode = self.context.createGain();
        source.gain = gainNode;

        source.buffer = buffer;                     // tell the source which sound to play
        source.connect(gainNode)
        gainNode.connect(self.context.destination); // connect the source to the context's destination (the speakers)
                                  // play the source now

        self.currentlyPlaying = source;

        setTimeout(function(){

             var currTime = self.context.currentTime * 1000;
             source.gain.linearRampToValueAtTime(0, currTime);
             source.gain.linearRampToValueAtTime(1, currTime + FADE);

             var nextQueue = self.sourceQueue[self.sourceQueue.indexOf(buffer) + 1];

             if(nextQueue){
                 playSound(nextQueue);
             }

             console.log("Start Cross Fading",currTime)

        },(source.buffer.duration * 1000) - FADE);

        source.start(0);

        window.source = source;
    }

   playSound(sData);

}

MusicPlayer.prototype.play = function(url){

    var soundData = "";
    var self = this;

    var dfd = jQuery.Deferred();

    var playSound = function (buffer) {
        var source = self.context.createBufferSource(); // creates a sound source
        source.buffer = buffer;                    // tell the source which sound to play
        source.connect(self.context.destination);       // connect the source to the context's destination (the speakers)
        source.start(0);                           // play the source now

        self.source = source;
        self.source.onended = function(){
            dfd.resolve(url);
           console.log("SONG ENDED ");
        }
        window.source = source;
    }

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        self.context.decodeAudioData(request.response, function(buffer) {
            soundData = buffer;
            playSound(soundData);
        }, function(){
            console.log("ERROR DECODING FILE");
        });
    }
    request.send();

    return dfd;
}


jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR){
    if(options.url.indexOf("semetric") > 0){
        options.url = options.url.indexOf("?") < 0 ? options.url + "?token=" + token : options.url +"&token";
    }
});

var API = semetric.factory(jQuery);
semetric.options.API_URL = "http://hairy-octo-bear.herokuapp.com/api/";

wof.controller("AppController",["$scope",function($scope){

    var geocoder = new google.maps.Geocoder();
    $scope.myposition = this.myposition = {};

    var onLocation = function(position){
            var latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            geocoder.geocode({"latLng":latlng},function(result,status){
                if (status == google.maps.GeocoderStatus.OK){

                    $scope.doLater(function(){
                        $scope.myposition = result.first();
                        window.localStorage["mylocation"] = JSON.stringify($scope.myposition);
                        console.log("MY POSITION ",$scope.myposition);
                    });
                }
            });
        }

    if(!window.localStorage["mylocation"]){
        navigator.geolocation.getCurrentPosition(onLocation);
    }else{
        $scope.myposition = JSON.parse(window.localStorage["mylocation"]);
        console.log("CACHE LOCATION ",$scope.myposition);
    }

}]);

wof.controller("AritstListController",["$timeout","$scope",function($timeout,$scope){

    var charts = API.charts().artistCharts()
    var self   = this;
    var player = new MusicPlayer();

    var startPlaying = function(){
        //player.playList(self.chartAlbums);
    }

    jQuery.get(semetric.options.API_URL + "chart/" + "f4c9ea0888be458a9c2e52b3e754c2bf").done(function(result){
        $scope.doLater(function(){
           self.chartAlbums = result.response.data.filter(function(d){

               /*d.releasegroup.images = [{
                   url:"http://app.musicmetric.com/img/core/artist_126s.png"
               }];*/

               // fetch torrent data
               var timeseries = new semetric.core.timeseries.Timeseries();
               timeseries.url = semetric.options.API_URL + "artist/" + d.artist.id + "/downloads/bittorrent"

               timeseries.update({granularity:"day"}).then(function(){
                   $scope.doLater(function(){
                       d.downloads = timeseries;
                   });
               });

               return d.releasegroup.images.first().url !== null;
           });
           startPlaying();
        });
    });

    //player.playList(MP3s)

}]);

wof.directive("gmap",function(){
   return {
       link:function(scope,element){

           function initialize() {
               var mapOptions = {
                   center: new google.maps.LatLng(-34.397, 150.644),
                   zoom: 8
               };

               var map = new google.maps.Map(element.get().first(),
                   mapOptions);
           }

           google.maps.event.addDomListener(window, 'load', initialize);
       }
   }
});

wof.directive("sparkline",function(){
    return {
        link:function(scope,element,attrs){
          attrs.$observe("graph",function(graph){
              if(graph)
                drawGraph(JSON.parse(graph));
          });

          function drawGraph(data){
              nv.addGraph({
                  generate: function() {
                      var chart = nv.models.sparkline()
                          .width(100)
                          .height(30)



                      d3.select(element.get().first())
                          .datum(data)
                          .call(chart);
                      return chart;

                  },
                  callback: function(graph) {
                      //log("Sparkline rendered");
                  }
              });

          }
        }
    }
})




function sine() {
    var sin = [];

    for (var i = 0; i < 100; i++) {
        sin.push({x: i, y: Math.sin(i/10)});
    }

    return sin;
}


