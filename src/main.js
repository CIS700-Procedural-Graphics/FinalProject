const THREE = require('three');
import Framework from './framework'
import Parser from './house-parser'

var startTime = Date.now();
var currTime = startTime;
var parsers = [];
var sound;
var audioAnalyser;

var settings = {
  changeColor : true,
  bulgeSpeaker : false,
  varyIter : false,
  changeBackground : true
}


var colorMat = new THREE.ShaderMaterial({
    uniforms: {
      image: { type: "t", value: THREE.ImageUtils.loadTexture('./colors.jpg') },
      u_albedo: { type: 'v3', value: new THREE.Color('#404040') },
      u_ambient: { type: 'v3', value: new THREE.Color('#404040') },
      u_lightPos: { type: 'v3', value: new THREE.Vector3(75, 100, 0) },
      u_lightCol: { type: 'v3', value: new THREE.Color('#ffffff') },
      u_lightIntensity: { type: 'f', value: 2 },
      loudness: { type: 'f', value: 0.0 }
  },
    vertexShader: require('./shaders/color-vert.glsl'),
    fragmentShader: require('./shaders/color-frag.glsl')
  });


function onLoad(framework) {
  var {scene, camera, renderer, gui, stats} = framework; 

  lightsCamera(scene, camera);
  showLayout(scene, camera);
  addMusic(scene, camera);

  gui.add(settings, 'changeColor');
  gui.add(settings, 'bulgeSpeaker');
  gui.add(settings, 'varyIter');
  gui.add(settings, 'changeBackground');
}

function clearScene(scene, camera) {
  while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }

  lightsCamera(scene, camera);
}

function lightsCamera(scene, camera) {
  camera.position.set(0, 20, 0);
  camera.lookAt(new THREE.Vector3(0,0,0));

  var light = new THREE.AmbientLight(0x404040);
  scene.add(light);

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(75, 100, 0);
  scene.add(directionalLight);
}

function showShapeGrammar(scene, camera) {
  camera.position.set(1, 10, 10);
  camera.lookAt(new THREE.Vector3(0,0,0));

  var position = new THREE.Vector3(0, 0, 0);
  var direction = new THREE.Vector3(0, 1, 0);
  var parser = new Parser(position, direction, scene, 10);
  parser.render(1);
}

function showLayout(scene, camera) {
  camera.position.set(221, 10, 25);
  camera.lookAt(new THREE.Vector3(0,0,0));

  var height = 100;
  var radius = 50;

  //speaker mid
  var spkMG = new THREE.CylinderGeometry( radius, radius, height, 32 );
  var spkMM = new THREE.MeshPhongMaterial({color: 0x191919});
  var spkM = new THREE.Mesh(spkMG, spkMM);
  scene.add(spkM);

  //speaker top
  var spkTG = new THREE.CylinderGeometry( 2 * radius / 3, radius, height / 4, 32 );
  var spkTM = new THREE.MeshPhongMaterial({color: 0x191919});
  var spkT = new THREE.Mesh(spkTG, spkTM);
  spkT.position.set(0, 10 * height / 16, 0);
  scene.add(spkT);

  //speaker base
  var spkBG = new THREE.CylinderGeometry(radius, 2 * radius / 3, height / 4, 32);
  var spkBM = new THREE.MeshPhongMaterial({color: 0x191919});
  var spkB = new THREE.Mesh(spkBG, spkBM);
  spkB.position.set(0, - 5 * height / 8, 0);
  scene.add(spkB);
  
  for (var y = 5 - (height / 2); y <= height / 2 - 5; y+= 5) 
  {
    for (var a = 0; a < 2 * Math.PI; a+= Math.PI / 27) 
    {
      var x = radius * Math.sin(a);
      var z = radius * Math.cos(a);
      var dir = new THREE.Vector3(-x, y, -z);

      var cg = new THREE.CylinderGeometry(2.5, 2.5, 2, 16);
      var m = colorMat;
      var cyl = new THREE.Mesh(cg, m);
      
      cyl.position.set(x, y, z);
      cyl.lookAt(dir);
      cyl.rotateX(Math.PI / 2);

      scene.add(cyl);


      var position = new THREE.Vector3(x, y, -z);
      dir.normalize();
      var dirS = new THREE.Vector3(x + dir.x, 0, -z + dir.z).normalize();
      position.addScaledVector(dirS, 1.0);
      var parser = new Parser(position, dirS, scene, 2.5);

      parsers.push(parser);

      parser.render(1);
    }
  } 
}

function addMusic(scene, camera) {
  var listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);
  var audioLoader = new THREE.AudioLoader();

  audioLoader.load('../music.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
  });

  audioAnalyser = new THREE.AudioAnalyser( sound, 64 );
}

function onUpdate(framework) {
 currTime = Date.now() - startTime;

  var t = currTime / 10000;

  if (t < 1.35)
  {
    rotateCam(framework.camera, 200, t, 2);
  }
  else if (t < 2)
  {
    settings.bulgeSpeaker = true;
    rotateCam(framework.camera, 100, t, 10);
  } 
  else if (t < 2.1)
  {
    framework.camera.fov = 75;
    settings.varyIter = true;
  }
  else if (t < 3)
  {
    rotateCam(framework.camera, 100, t, 30);
  }
  else if (t < 5)
  {    
    settings.bulgeSpeaker = false;
    framework.camera.fov = 75;
    rotateCam(framework.camera, 60, - t, 30);
  }
  else
  {
    framework.camera.position.set(221, 10, 25);
    framework.camera.lookAt(new THREE.Vector3(0, 0, 0));
    settings.bulgeSpeaker = true;
  }
  var r = Math.random();

  if (audioAnalyser) {
    var avgFrequency = audioAnalyser.getAverageFrequency() / 128;
    r = clamp((avgFrequency - 0.60) / 0.4, 0, 1); //usually between 0.3 and 0.9
  }

  // small cyls change color based on loudness
  if (settings.changeColor) 
  {
    colorMat.uniforms.loudness.value = r * 4;
  }

  // bulge speaker based on loudness
  if (settings.bulgeSpeaker)
  {
    framework.camera.fov = clamp(r * 120, 75, 100);
    framework.camera.updateProjectionMatrix();
  }

  // vary iterations with loudness values
  if (settings.varyIter)
  {
    var iter = clamp(Math.ceil(((r - 0.3) / 0.7) * 5), 1, 5);
    for (var i = 0; i < parsers.length; i++)
    {
      if (Math.random() < 0.5)
      {
        parsers[i].render(iter);
      }
    }
  }

  //change background color when loudness above threshold
  if (settings.changeBackground)
  {
    framework.scene.background = getRandomColor(r);
  }
}

function rotateCam(camera, radius, t, f)
{
  var angle = t * (2 * Math.PI) / f;
  camera.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  if (radius < 100)
  {
    camera.lookAt(new THREE.Vector3(camera.position.x / 2, radius, camera.position.z / 2));
  }
  camera.updateProjectionMatrix();
}

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function getRandomColor(t) {
  var a = new THREE.Vector3(0.5, 0.5, 0.5);
  var b = new THREE.Vector3(0.5, 0.5, 0.5);
  var c = new THREE.Vector3(1.0, 1.0, 1.0);
  var d = new THREE.Vector3(0.00, 0.33, 0.67);
  return new THREE.Color(
      getC(t, a.x, b.x, c.x, d.x),
      getC(t, a.y, b.y, c.y, d.y),
      getC(t, a.z, b.z, c.z, d.z)
    );
}

function getC(t, a, b, c, d) {
  return a + b * Math.cos(6.28318 * (c * t + d));
}

Framework.init(onLoad, onUpdate);
