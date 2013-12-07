var wof = angular.module("wof",[]);

wof.run(function($rootScope,$timeout){
    $rootScope.doLater = function(fn){
        $timeout(function(){
            fn();
        },0);
    }
});

var token = "dd7bc0e50cdd4edca1f29af02f10e74f&_=1386421294382";

var MusicPlayer = function(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
}

MusicPlayer.prototype.play = function(url){

    var soundData = "";
    var self = this;

    var playSound = function (buffer) {
        var source = self.context.createBufferSource(); // creates a sound source
        source.buffer = buffer;                    // tell the source which sound to play
        source.connect(self.context.destination);       // connect the source to the context's destination (the speakers)
        source.start(0);                           // play the source now

        self.source = source;
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
}


jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR){
    if(options.url.indexOf("semetric") > 0){
        options.url = options.url.indexOf("?") < 0 ? options.url + "?token=" + token : options.url +"&token";
    }
});

var API = semetric.factory(jQuery);
semetric.options.API_URL = "http://api.semetric.com/";



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
            console.log("My Position",myposition);
        }

    if(!window.localStorage["mylocation"]){
        navigator.geolocation.getCurrentPosition(onLocation);
    }else{
        $scope.myposition = JSON.parse(window.localStorage["mylocation"]);
        console.log("CACHE LOCATION ",$scope.myposition);
    }

}]);

wof.controller("AritstListController",["$timeout",function($timeout){
    var charts = API.charts().artistCharts()
    var self   = this;

    var downloadCharts = charts.filter(function(chart){
        return chart.label.indexOf("BitTorrent") > -1;
    }).first();


    var player = new MusicPlayer();

    player.play("data/test.mp3");

    /*downloadCharts.populate().then(function(collection){

        var allArtist = [];
        var artistsReady = function(artist){
            allArtist.push(artist);
            if(allArtist.length == collection.models.length){
                render();
            }
        }

        var render = function(){
            $timeout(function(){
                console.log("All Chart Artists ",allArtist);
                self.chartArtists = allArtist;
            },0);
        }

        var artistPromises = collection.models.forEach(function(chartArtist){
            chartArtist.artist().then(artistsReady);
        });

        semetric.deferred.when(artistPromises).done(function(result){
           console.log("RESULT -------> ",result);
        });

    },function(error){
        console.log("ERROR",error);
    });*/

}]);

wof.directive("gmap",function(){
   return {
       link:function(scope,element){

           function initialize() {
               var mapOptions = {
                   center: new google.maps.LatLng(-34.397, 150.644),
                   zoom: 8
               };

               console.log("Element ID ",element.get().first());

               var map = new google.maps.Map(element.get().first(),
                   mapOptions);
           }

           google.maps.event.addDomListener(window, 'load', initialize);
       }
   }
});

