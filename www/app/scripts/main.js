
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

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

var MusicPlayer = function(onUpdate){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    window.context = this.context;
    this.onUpdate = onUpdate;
}

MusicPlayer.prototype.playList = function(list){
    var currentIndex = -1;
    var self = this;
    self.sourceQueue    = [];
    var currentURL      = 0;

    var loadSource = function(url){

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {

            self.context.decodeAudioData(request.response, function(buffer) {
                self.sourceQueue.push(buffer);
                if(self.sourceQueue.length === 1){
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

    loadSource(list[currentURL]);
}

MusicPlayer.prototype.playWithSource = function(sData){

    var self = this;
    var FADE = 2000;
    var analyzer = null;

    var playSound = function (buffer) {
        var source = self.context.createBufferSource(); // creates a sound source

        analyzer = context.createAnalyser();
        analyzer.fftSize = 2048;

        var gainNode = self.context.createGain();
        source.gain = gainNode;

        source.buffer = buffer;
        source.connect(gainNode)

        gainNode.connect(analyzer)

        analyzer.connect(self.context.destination);

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


   function doUpdate(){
        if(analyzer){
            var data = new Uint8Array(2048);
            analyzer.getByteFrequencyData(data);
            self.onUpdate(data);

            window.requestAnimationFrame(doUpdate);
        }
    }

   window.requestAnimationFrame(doUpdate);



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

    var canvas = document.getElementById("visFX");
    var canvas_context = document.getElementById("visFX").getContext("2d");
    var randomColors = d3.scale.category20();

    //var awesomeRenderer = render3d();

    var renderVisuals = function(data){

        //awesomeRenderer(data);

        // This graph has 30 bars.
        var num_bars = 30;

        // Clear the canvas
        canvas_context.clearRect(0, 0, canvas.width, canvas.height);

        // Break the samples up into bins
        var bin_size = Math.floor(50 / num_bars);
        for (var i=0; i < num_bars; ++i) {
                var sum = 0;
                for (var j=0; j < bin_size; ++j) {
                    sum += data[(i * bin_size) + j];
                }

                // Calculate the average frequency of the samples in the bin
                var average = sum / bin_size;

                // Draw the bars on the canvas
                var bar_width = canvas.width / num_bars;
                var scaled_average = (average / 512) * canvas.height;

                canvas_context.fillStyle = randomColors(i);
                canvas_context.fillRect(i * bar_width, canvas.height, bar_width - 2,
                    -scaled_average);

        }
    }

    var charts = API.charts().artistCharts()
    var self   = this;
    var player = new MusicPlayer(renderVisuals);

    window.previews = [];

    var startPlaying = function(){
        player.playList(previews);
    }

    jQuery.get(semetric.options.API_URL + "chart/" + "4104486834dc527b852262b2c9f0a3a1?city=nyc").done(function(result){
        $scope.doLater(function(){
           previews = ["data/test0.mp3"];
           self.chartAlbums = result.response.data.filter(function(d){

               if(d.releasegroup.preview_url)
                    previews.push(d.releasegroup.preview_url);

               // fetch torrent data
               var timeseries = new semetric.core.timeseries.Timeseries();
               timeseries.url = semetric.options.API_URL + "artist/" + d.artist.id + "/downloads/bittorrent"

               /*timeseries.update({granularity:"day"}).then(function(){
                   $scope.doLater(function(){
                       d.downloads = timeseries;
                   });
               });*/

               return d.releasegroup.images.first().url !== null;
           });
           startPlaying();
        });
    });

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


/*function render3d() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, $(window).width() / $(window).height(), 1, 1000);
    var renderer = new THREE.WebGLRenderer();
    var cubes = new Array();
    var boost = 10;
    var controls;

    jQuery("#three").append(renderer.domElement);

    var i = 0;
    for(var x = 0; x < 30; x += 2) {
        var j = 0;
        cubes[i] = new Array();
        for(var y = 0; y < 30; y += 2) {
            var geometry = new THREE.CubeGeometry(1.5, 1.5, 1.5);

            var material = new THREE.MeshPhongMaterial({
                color: randomFairColor(),
                ambient: 0x808080,
                specular: 0xffffff,
                shininess: 20,
                reflectivity: 5.5
            });

            cubes[i][j] = new THREE.Mesh(geometry, material);
            cubes[i][j].position = new THREE.Vector3(x, y, 0);

            scene.add(cubes[i][j]);
            j++;
        }
        i++;
    }

    var light = new THREE.AmbientLight(0x505050);
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(1, 1, 0);
    scene.add(directionalLight);


    directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(0, -1, -1);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(-1, -1, 0);
    scene.add(directionalLight);

    camera.position.z = 50;

    //controls = new THREE.OrbitControls(camera);
    //controls.addEventListener('change', render);

    for(var i = 0; i < 7; i++) {
        //controls.pan(new THREE.Vector3( 1, 0, 0 ));
        //controls.pan(new THREE.Vector3( 0, 1, 0 ));
    }

    var render = function (array) {

        if(typeof array === 'object' && array.length > 0) {
            var k = 0;
            for(var i = 0; i < cubes.length; i++) {
                for(var j = 0; j < cubes[i].length; j++) {
                    var scale = (array[k] + boost) / 30;
                    cubes[i][j].scale.z = (scale < 1 ? 1 : scale);
                    k += (k < array.length ? 1 : 0);
                }
            }
        }
        //controls.update();
        renderer.render(scene, camera);
    };

    renderer.setSize($("#three").width(), $("#three").height());

    function randomFairColor() {
        var min = 64;
        var max = 224;
        var r = (Math.floor(Math.random() * (max - min + 1)) + min) * 65536;
        var g = (Math.floor(Math.random() * (max - min + 1)) + min) * 256;
        var b = (Math.floor(Math.random() * (max - min + 1)) + min);
        return r + g + b;
    }

    return render
}*/

