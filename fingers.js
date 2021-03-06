var $ = function(id){return document.getElementById(id)}; // lazy dev is lazy
var debug = gup("debug");
var localMediaStream = null;

if(debug){ // I haven't quite figured out how this will work yet..
  // write image instead of using video
  $('prompt').style.display = "none";
  localMediaStream = true;
  video = document.getElementById('debugImg');
  video.src = "debugImg.png";
  snapshot();
}else{
  window.URL = window.URL || window.webkitURL;
  navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || navigator.msGetUserMedia;
  var video = document.querySelector('video'); // the video input source
  // Start Video Stream
  navigator.getUserMedia({video: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
    $('guide').style.display = "block";
    $('go').style.display = "block";
    $('prompt').style.display = "none";
    // Draw shapes onto Canvas
  }, function(){
     alert("Enable and Allow your camera");
  });
}
var canvas = new fabric.Canvas('canvas'); // the main canvas element that can be modified by resizing etc.
var canvas2 = $('canvas2').getContext('2d'); // the canvas element that will contain the video captured
var stripWidth = 170; // The magnetic strip width
var count=9; // The countdown duration in seconds -- note the extra second for kids..
var counter; // The actual timer.

// The magnetic strip rectangle.
var strip = new fabric.Rect({
  width: stripWidth,
  height: 25,
  top: 342,
  left: 355,
  hasBorders: false,
  cornerSize: 5,
  fill: 'rgba(255,255,255,0.5)'
});

var finger = new fabric.Rect({
  width: 48,
  height: 15,
  top: 247,
  left: 392,
  angle: 367,
  lockScalingY: true,
  hasBorders: false,
  cornerSize: 5,
  fill: 'rgba(0,0,255,0.5)'
});

strip.on('modified', function(options) {
  stripWidth = strip.getWidth(); // get teh new width
});

strip.on('scaling', function(e){
  var y = strip.top +13;
  magnify(e.e, y); // mag glass
});

finger.on('modified', function(options) {
  measure();
});

finger.on('scaling', function(e){
  var y = e.e.offsetY;
  magnify(e.e, y); // mag glass
});

function measure(){
  var ringSize = scaleToRingSize(finger.getWidth()); // gets ring size in mm
  console.log(ringSize);
// var ringSizeInc = ringSize;
  var ringSizeInc = parseFloat(ringSize) * 1.2; // ringSize was the finger size but we need to know the ring size which is ~20% larger than a finger (comfort)
  console.log("after", ringSizeInc);
  var ringSizeLegacy = new ringSizeFromMM(ringSizeInc); // gets the ring Size in legacy broken industry form IE 9, object returned.
  // console.log("ringSizeLegacy", ringSizeLegacy);
  var ringSizeRnd = Math.round(ringSizeInc*100)/100; // Round to two decimal places for presentation
  document.getElementById('fingerMM').innerHTML = ringSizeRnd + "mm";
  if(ringSizeLegacy.eu) document.getElementById('fingerEU').innerHTML = ringSizeLegacy.eu + " EU";
  if(ringSizeLegacy.us) document.getElementById('fingerUS').innerHTML = ringSizeLegacy.us + " US";
}

function magnify(e, y){
  var img=document.getElementById("snapshot"); // get the image id
  var mag=document.getElementById("mag"); // get the zoom target IE magnifying class canvas
  var magctx=mag.getContext("2d"); // get the mag glass context
  magctx.drawImage(img, e.offsetX -25, y -25, 50,50, 0, 0, 200, 200 );
  // Stroked line
  magctx.beginPath();
  magctx.moveTo(100,50);
  magctx.lineTo(100,100);
  magctx.closePath();
  magctx.strokeStyle = 'rgba(255,255,255,0.3)';
  magctx.stroke();
}

function snapshot() {
  
  console.log("Grabbing snapshot");

  if (localMediaStream) {
    video.style.display = "none";
    $('guide').style.display = "none";
    $('go').style.display = "none";
    // $('sizes').style.display = "block";
    $('msi').style.display = "block"; // show the instruction to resize mag strip
    canvas2.drawImage(video, 0, 0, 800, 600); // draw the captured content onto a canvas
	var c = $('canvas2'); // get the canvas without context
    var dataURL = c.toDataURL(); // get the data url of teh canvas
    $('snapshot').src = dataURL; // write the data url to the image holder
	canvas.add(strip); // add the strip rectangle to the edit canvas
	stripWidth = strip.getWidth(); // get teh new width
    $('msn').style.display = "block"; // show the instruction to resize mag strip
	
  }
}

// Takes a scale value and tries to figure out the mm diameter of each ring
function scaleToRingSize(widthPx){
  console.log("widthPx:" + widthPx, "stripWidth:"+stripWidth);
  var widthInMM = 85.72500 / stripWidth * widthPx;
  console.log("width in MM", widthInMM);
  return widthInMM;
  // return (85.72500 / stripWidth * widthPx).toFixed(2);
}

function countdown(){
  $('timer').style.display = "block"; // show countdown
  // counting down
  counter=setInterval(timer, 1000); //1000 will  run it every 1 second
}

// Create snapshot on click
document.getElementById('go').addEventListener('click', countdown, false);

// Show finger ring thing on next button click
document.getElementById('msn').addEventListener('click', showFinger, false);

// Show mm size on finish
document.getElementById('finish').addEventListener('click', showFinished, false);

// show finished
function showFinished(){
  $('finished').style.display = "block";
  $('sizes').style.display = "block";
  $('mag').style.display = "none";
  $('fsi').style.display = "none";
  $('finish').style.display = "none";
  $('fingerMM').style.display = "block";
  $('fingerEU').style.display = "block";
  $('fingerUS').style.display = "block";
  $('reset').style.display = "block";
  
}

// Show finger
function showFinger(){
  $('msn').style.display = "none";
  $('msi').style.display = "none";
  $('fsi').style.display = "block";
  $('finish').style.display = "block";
  strip.remove();
  canvas.add(finger); // add the first finger to the edit canvas
  measure();
}

function timer()
{
  count=count-1;
  // console.log(count);
  document.getElementById('timer').innerHTML = count;

  if(count == 0){
    $('timer').style.display = "none";
    snapshot();
    clearInterval(counter);
    return;
  }
}

var ringSizeFromMM = function(size){
  /* Below can be minified then ignored, it's just the ring sizes conversion chart from http://en.wikipedia.org/wiki/Ring_size -- Make for insane readin tho.. */
  var sizes = [{11.63 : {us: 0 , eu: null}, 11.84 : {us: 0.25 , eu: null}, 12.04 : {us: 0.5 , eu: " A "}, 12.24 : {us: 0.75 , eu: " A and a half "}, 12.45 : {us: 1 , eu: " B "}, 12.65 : {us: 1.25 , eu: " B  and a half "}, 12.85 : {us: 1.5 , eu: " C "}, 13.06 : {us: 1.75 , eu: " C and a half "}, 13.26 : {us: 2 , eu: " D "}, 13.46 : {us: 2.25 , eu: " D and a half "}, 13.67 : {us: 2.5 , eu: " E "}, 13.87 : {us: 2.75 , eu: " E and a half "}, 14.07 : {us: 3 , eu: " F "}, 14.27 : {us: 3.25 , eu: " F and a half "}, 14.48 : {us: 3.5 , eu: " G "}, 14.68 : {us: 3.75 , eu: " G and a half "}, 14.88 : {us: 4 , eu: " H "}, 15.09 : {us: 4.25 , eu: " H and a half "}, 15.29 : {us: 4.5 , eu: " I "}, 15.49 : {us: 4.75 , eu: " J "}, 15.7 : {us: 5 , eu: " J and a half "}, 15.9 : {us: 5.25 , eu: " K "}, 16.1 : {us: 5.5 , eu: " K and a half "}, 16.31 : {us: 5.75 , eu: " L "}, 16.51 : {us: 6 , eu: " L and a half "}, 16.71 : {us: 6.25 , eu: " M "}, 16.92 : {us: 6.5 , eu: " M and a half "}, 17.12 : {us: 6.75 , eu: " N "}, 17.32 : {us: 7 , eu: " N and a half "}, 17.53 : {us: 7.25 , eu: " O "}, 17.73 : {us: 7.5 , eu: " O and a half "}, 17.93 : {us: 7.75 , eu: " P "}, 18.14 : {us: 8 , eu: " P and a half "}, 18.34 : {us: 8.25 , eu: " Q "}, 18.54 : {us: 8.5 , eu: " Q and a half "}, 18.75 : {us: 8.75 , eu: " R "}, 18.95 : {us: 9 , eu: " R and a half "}, 19.15 : {us: 9.25 , eu: " S "}, 19.35 : {us: 9.5 , eu: " S and a half "}, 19.56 : {us: 9.75 , eu: " T "}, 19.76 : {us: 10 , eu: " T and a half "}, 19.96 : {us: 10.25 , eu: " U "}, 20.17 : {us: 10.5 , eu: " U and a half "}, 20.37 : {us: 10.75 , eu: " V "}, 20.57 : {us: 11 , eu: " V and a half "}, 20.78 : {us: 11.25 , eu: " W "}, 20.98 : {us: 11.5 , eu: " W and a half "}, 21.18 : {us: 11.75 , eu: " X "}, 21.39 : {us: 12 , eu: " X and a half "}, 21.59 : {us: 12.25 , eu: " Y "}, 21.79 : {us: 12.5 , eu: " Z "}, 22 : {us: 12.75 , eu: null}, 22.2 : {us: 13 , eu: null}, 22.4 : {us: 13.25 , eu: null}, 22.61 : {us: 13.5 , eu: null}, 22.81 : {us: 13.75 , eu: null}, 23.01 : {us: 14 , eu: null}, 23.22 : {us: 14.25 , eu: null}, 23.42 : {us: 14.5 , eu: null}, 23.62 : {us: 14.75 , eu: null}, 23.83 : {us: 15 , eu: null}, 24.03 : {us: 15.25 , eu: null}, 24.23 : {us: 15.5 , eu: null}, 24.43 : {us: 15.75 , eu: null}, 24.64 : {us: 16 , eu: null}   }]  
  /* End of conversions */
  obj = sizes[0];
  var i = 0;
  for(var key in obj){ // key is each size ring
	if((key >= size) && (i !== 0)){ // is the size greater than what we want?
	  return obj[key]; // yay
    }
	i++;
  }
}


function gup( name ){
name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
var regexS = "[\\?&]"+name+"=([^&#]*)";  
var regex = new RegExp( regexS );  
var results = regex.exec( window.location.href ); 
 if( results == null )    return "";  
else    return results[1];}
