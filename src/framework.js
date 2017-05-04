
const THREE = require('three');
import Stats from 'stats-js'
import DAT from 'dat-gui'
import { analyze } from 'web-audio-beat-detector';

// when the scene is done initializing, the function passed as `callback` will be executed
// then, every frame, the function passed as `update` will be executed
function init(callback, update) {
  //var gui = new DAT.GUI();

  var framework = {
    //gui: gui,
    paused: false,
    audioStartOffset: 0,
    audioStartTime: 0,
    audioBuffer: undefined,
    cameraPaused: false,
    automaticSwitchingOn: true
  };

  function createAndConnectAudioBuffer() {
    // create the source buffer
    framework.audioSourceBuffer = framework.audioContext.createBufferSource();
    // connect source and analyser
    framework.audioSourceBuffer.connect(framework.audioAnalyser);
    framework.audioAnalyser.connect(framework.audioContext.destination);
  }

  function playAudio(file) {
    createAndConnectAudioBuffer();
    framework.audioFile = file;

    var fileName = framework.audioFile.name;
    document.getElementById('guide').innerHTML = "Playing " + fileName;
    var fileReader = new FileReader();
    
    fileReader.onload = function (e) {
        var fileResult = fileReader.result;
        framework.audioContext.decodeAudioData(fileResult, function(buffer) {
          framework.audioSourceBuffer.buffer = buffer;
          framework.audioBuffer = buffer;
          framework.audioSourceBuffer.start();
          framework.audioSourceBuffer.loop = true;
          analyze(framework.audioSourceBuffer.buffer).then((bpm) => {
              // the bpm could be analyzed 
              framework.songBPM = bpm;
          })
          .catch((err) => {
              // something went wrong 
              console.log("couldn't detect BPM");
          });
        }, function(e){"Error with decoding audio data" + e.err});
    };
    fileReader.readAsArrayBuffer(framework.audioFile);
  }

  // run this function after the window loads
  window.addEventListener('load', function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020202, 0);

    document.body.appendChild(renderer.domElement);

    // resize the canvas when the window changes
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // set up audio processing
    framework.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // create analyser
    framework.audioAnalyser = framework.audioContext.createAnalyser();
    framework.audioAnalyser.smoothingTimeConstant = 0.3;
    framework.audioAnalyser.fftSize = 1024;
    // create the source buffer
    framework.audioSourceBuffer = framework.audioContext.createBufferSource();

    // connect source and analyser
    framework.audioSourceBuffer.connect(framework.audioAnalyser);
    framework.audioAnalyser.connect(framework.audioContext.destination);

    // add drag and drop functionality for uploading audio file
    window.addEventListener("dragenter", dragenter, false);  
    window.addEventListener("dragover", dragover, false);
    window.addEventListener("drop", drop, false);
    // add pausing functionality via spacebar
    window.addEventListener("keypress", keypress, false);

    function dragenter(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function dragover(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function drop(e) {
      e.stopPropagation();
      e.preventDefault();
      if (framework.audioFile == undefined) {
        playAudio(e.dataTransfer.files[0]);
      } else {
        // stop current visualization and load new song
        framework.audioSourceBuffer.stop();
        playAudio(e.dataTransfer.files[0]);
      }
    }

    function keypress(e) {
      // spacebar
      if (e.keyCode == 32 && framework.audioBuffer != undefined) {
        if (!framework.paused) {
          framework.paused = true;
          framework.audioSourceBuffer.stop();
          // Measure how much time passed since the last pause.
          framework.audioStartOffset += framework.audioContext.currentTime - framework.audioStartTime;
        } else {
          framework.paused = false;
          framework.audioStartTime = framework.audioContext.currentTime;

          createAndConnectAudioBuffer();
          framework.audioSourceBuffer.buffer = framework.audioBuffer;
          // Start playback, but make sure we stay in bound of the buffer.
          framework.audioSourceBuffer.start(0, framework.audioStartOffset % framework.audioBuffer.duration);
          framework.audioSourceBuffer.loop = true;
        }
      }
      // 0
      if (e.keyCode == 48) {
        framework.visualizerIndex = 0;
      }
      // 1
      if (e.keyCode == 49) {
        framework.visualizerIndex = 1;
      }
      // 2
      if (e.keyCode == 50) {
        framework.visualizerIndex = 2;
      }
      // 3
      if (e.keyCode == 51) {
        framework.visualizerIndex = 3;
      }
      // p
      if (e.keyCode == 112) {
        if (!framework.cameraPaused) {
          framework.cameraPaused = true; 
        } else {
          framework.cameraPaused = false;
        }
      }
      // s
      if (e.keyCode == 115) {
        if (!framework.automaticSwitchingOn) {
          framework.automaticSwitchingOn = true; 
        } else {
          framework.automaticSwitchingOn = false; 
        }
      }
      // t
      if (e.keyCode == 116) {
        // toggle instructions
        if (document.getElementById('visualizerInfo').style.visibility == "hidden") {
          document.getElementById('visualizerInfo').style.visibility = "visible";
        } else {
          document.getElementById('visualizerInfo').style.visibility = "hidden";
        }
      }
    }

    // assign THREE.js objects to the object we will return
    framework.scene = scene;
    framework.camera = camera;
    framework.renderer = renderer;

    // begin the animation loop
    (function tick() {
      update(framework); // perform any requested updates
      renderer.render(framework.scene, framework.camera); // render the scene
      requestAnimationFrame(tick); // register to call this again when the browser renders a new frame
    })();

    // we will pass the scene, gui, renderer, camera, etc... to the callback function
    return callback(framework);
  });

}

export default {
  init: init
}

export const PI = 3.14159265
export const e = 2.7181718