var wof = angular.module("wof",[]);
var token = "dd7bc0e50cdd4edca1f29af02f10e74f&_=1386421294382";

jQuery.ajaxPrefilter(function(options, originalOptions, jqXHR){
    if(options.url.indexOf("musicmetric") > 0){
        options.url = options.url.indexOf("?") < 0 ? options.url + "?token=" + token : options.url +"&token";
    }
});

var API = semetric.factory(jQuery);
semetric.options.API_URL = "http://app.musicmetric.com/api/";

wof.controller("AppController",["$timeout",function($timeout){

}]);

wof.controller("AritstListController",["$timeout",function($timeout){
    var charts = API.charts().artistCharts()
    var self   = this;

    var downloadCharts = charts.filter(function(chart){
        return chart.label.indexOf("BitTorrent") > -1;
    }).first();

    downloadCharts.populate().then(function(collection){

        var allArtist = [];
        var artistsReady = function(artist){
            allArtist.push(artist);
            if(allArtist.length == collection.models.length){
                render();
            }
        }

        var render = function(){
            $timeout(function(){
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
    });

}]);

