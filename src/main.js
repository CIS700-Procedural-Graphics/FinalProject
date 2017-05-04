
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Scenes from './scenes'

var currentVisualizer;

// called after the scene loads
function onLoad(framework) {
  Scenes.initializeAllScenes(framework);

  currentVisualizer = Scenes.getScene("icosahedron");
  framework.visualizerIndex = 0;
  framework.scene = currentVisualizer.scene;
  framework.camera = currentVisualizer.camera;
  var renderer = framework.renderer;
  // var gui = framework.gui;

  // // LOOK: the line below is syntactic sugar for the code above. Optional, but I sort of recommend it.
  // // var {scene, camera, renderer, gui, stats} = framework; 

  // // edit params and listen to changes like this
  // // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  // gui.add(framework.camera, 'fov', 0, 130).onChange(function(newVal) {
  //   framework.camera.updateProjectionMatrix();
  // });
}

function switchVisualizer(framework, visualizerIndex) {
  currentVisualizer = Scenes.getSceneByIndex(visualizerIndex);
  framework.scene = currentVisualizer.scene;
  framework.camera = currentVisualizer.camera;
  framework.visualizerIndex = visualizerIndex;
}

// called on frame updates
function onUpdate(framework) {
  if (currentVisualizer != undefined) {
    // switch manually
    if (currentVisualizer.index != framework.visualizerIndex) {
      switchVisualizer(framework, framework.visualizerIndex);
    } 
    // switch automatically
    if (framework.automaticSwitchingOn) {
      if (Scenes.timeIsOnBeat(framework, 0.5)) {
        var randomNum = Scenes.getRandomInt(0, Scenes.getNumScenes());
        while (randomNum == framework.visualizerIndex) {
          randomNum = Scenes.getRandomInt(0, Scenes.getNumScenes());
        } 
        //console.log("switched to " + randomNum); 
        switchVisualizer(framework, randomNum);
      }
    }
    currentVisualizer.onUpdate(framework);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
