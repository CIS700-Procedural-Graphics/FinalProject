//GUI guiPresets
//JSON stores for dat.gui
//Pass into dat.GUI()
//Can paste here from the gear dialog in preset manager in dat.gui
// and can remove presets you don't want, modify, etc
//BUT to get these to load, must disable local storage in dat.gui gears window,
// (and then restart the browser session, or at least reload)
//More reliable than local storage
"use strict";


export var guiPresets_TailParticles = {
  load: {
    "preset": "8beat-spray",
    "closed": false,
    "remembered": {
      "Tutorial": {
        "0": {
          "sizeGeom": 0.45,
          "sizeRangeP": 0,
          "sizeOnsetScale": 0,
          "sizeOnsetEndP": 0.5,
          "sizeOnsetBias": 0.7000000000000001,
          "sizeMaxScale": 1,
          "sizeEndScale": 0,
          "sizeDecayBias": 0.30000000000000004,
          "sizeDecayStartP": 0.9,
          "velMagRangeP": 0,
          "velDecayStartP": 0.1,
          "velDecayBias": 0.30000000000000004,
          "colorLerpBias": 1,
          "colorStartRGB": [
            225.3869305074971,
            245,
            78.2889093137255
          ],
          "colorEndRGB": [
            175,
            63.0893166089966,
            16.459865196078443
          ]
        },
        "1": {
          "velScale": 0.02,
          "velFixedFlag": false,
          "velFixed": 0.5,
          "velDirBack": false,
          "velDirSide": false,
          "velDirVert": false,
          "linger": false,
          "durBeats": 1,
          "newParticleIntervalBeats": 0.25,
          "velThreshold": 5,
          "skipHead": true,
          "enable": false,
          "updateStepMsec": 10
       }
      },
      "Hi-V-Sparks": {
        "0": {
          "sizeGeom": 0.06,
          "sizeRangeP": 0.8,
          "sizeOnsetScale": 0,
          "sizeOnsetEndP": 0,
          "sizeOnsetBias": 0,
          "sizeMaxScale": 1,
          "sizeEndScale": 0,
          "sizeDecayBias": 1,
          "sizeDecayStartP": 0.1,
          "velMagRangeP": 0.1,
          "velDecayStartP": 0,
          "velDecayBias": 0.5,
          "colorLerpBias": 0.5,
          "colorStartRGB": [
            183.98437499999997,
            255,
            217.40349264705878
          ],
          "colorEndRGB": [
            255,
            8.98437500000001,
            8.98437500000001
          ]
        },
        "1": {
          "velScale": 0.24,
          "velFixedFlag": false,
          "velFixed": 0.5,
          "velDirBack": false,
          "velDirSide": false,
          "velDirVert": false,
          "linger": false,
          "durBeats": 2.5,
          "newParticleIntervalBeats": 0,
          "velThreshold": 30,
          "skipHead": true,
          "updateStepMsec": 10,
          "enable": false,
        }
      },
      "Default": {
        "0": {
          "sizeGeom": 0.1,
          "sizeRangeP": 0,
          "sizeOnsetScale": 0,
          "sizeOnsetEndP": 0.1,
          "sizeOnsetBias": 0.7,
          "sizeMaxScale": 1,
          "sizeEndScale": 0.2,
          "sizeDecayBias": 0.3,
          "sizeDecayStartP": 0.3,
          "velMagRangeP": 0,
          "velDecayStartP": 0.1,
          "velDecayBias": 0.3,
          "colorLerpBias": 0.7,
          "colorStartRGB": [
            0.9333333333333333,
            1,
            0
          ],
          "colorEndRGB": [
            0.8,
            0.06666666666666667,
            0.06666666666666667
          ]
        },
        "1": {
          "velScale": 0.02,
          "velFixedFlag": false,
          "velFixed": 0.5,
          "velDirBack": false,
          "velDirSide": false,
          "velDirVert": false,
          "linger": false,
          "durBeats": 1,
          "newParticleIntervalBeats": 0.25,
          "velThreshold": 5,
          "skipHead": true,
          "enable": false,
          "updateStepMsec": 10,
        }
      },
      "fading stands": {
        "0": {
          "sizeGeom": 0.4,
          "sizeRangeP": 0,
          "sizeOnsetScale": 0,
          "sizeOnsetEndP": 0.1,
          "sizeOnsetBias": 0.7000000000000001,
          "sizeMaxScale": 1,
          "sizeEndScale": 0.15,
          "sizeDecayBias": 0,
          "sizeDecayStartP": 0.5,
          "velMagRangeP": 0,
          "velDecayStartP": 0.5,
          "velDecayBias": 0.5,
          "colorLerpBias": 0.7000000000000001,
          "colorStartRGB": [
            255,
            16.48437500000001,
            16.48437500000001
          ],
          "colorEndRGB": [
            49.46537990196079,
            60.96741637831608,
            245
          ]
        },
        "1": {
          "velScale": 0.04,
          "velFixedFlag": false,
          "velFixed": 0.5,
          "velDirBack": false,
          "velDirSide": false,
          "velDirVert": false,
          "linger": false,
          "durBeats": 3,
          "newParticleIntervalBeats": 0.7000000000000001,
          "velThreshold": 5,
          "skipHead": true,
          "updateStepMsec": 10,
          "enable": false,
        }
      },
      "delicate": {
        "0": {
          "sizeGeom": 0.12,
          "sizeRangeP": 0,
          "sizeOnsetScale": 0,
          "sizeOnsetEndP": 0.1,
          "sizeOnsetBias": 0.7000000000000001,
          "sizeMaxScale": 1,
          "sizeEndScale": 0.2,
          "sizeDecayBias": 0.30000000000000004,
          "sizeDecayStartP": 0.6000000000000001,
          "velMagRangeP": 0,
          "velDecayStartP": 0.9,
          "velDecayBias": 0.9,
          "colorLerpBias": 0.7000000000000001,
          "colorStartRGB": [
            255,
            16.48437500000001,
            16.48437500000001
          ],
          "colorEndRGB": [
            49.46537990196079,
            60.96741637831608,
            245
          ]
        },
        "1": {
          "velScale": 0.03,
          "velFixedFlag": false,
          "velFixed": 0.5,
          "velDirBack": false,
          "velDirSide": false,
          "velDirVert": false,
          "linger": false,
          "durBeats": 5,
          "newParticleIntervalBeats": 0.1,
          "velThreshold": 5,
          "skipHead": true,
          "enable": false,
          "updateStepMsec": 10,
        }
      },
    },
    
    "folders": {
      "Tail Particles": {
        "preset": "Default",
        "closed": false,
        "folders": {}
      }
    }
  }//load
}

export var guiPresets_VXmanager = {
    load: {
  "preset": "safe-tight",
  "remembered": {
    "Safe": {
      "0": {
        "num": 8,
        "gravityAmp": 9.81,
        "spacing": 0.1,
        "mass": 15,
        "k": 4000,
        "damping": 0.5,
        "objectSize": 1,
        "objectTaper": 1,
        "dtUnstableMsec": 30,
        "dtStableMsec": 30,
        "dtSkipMsec": 10
      }
    },
    "tail-mr-squiggles": {
      "0": {
        "num": 8,
        "gravityAmp": 5.5,
        "spacing": 0,
        "mass": 15,
        "k": 9000,
        "damping": 0.44,
        "objectSize": 1.3,
        "objectTaper": 1,
        "dtUnstableMsec": 30,
        "dtStableMsec": 30,
        "dtSkipMsec": 10
      }
    },
    "safe-tight": {
      "0": {
        "num": 13,
        "gravityAmp": 9.8,
        "spacing": 0,
        "mass": 15,
        "k": 15500,
        "damping": 0.88,
        "objectSize": 1,
        "objectTaper": 1,
        "dtUnstableMsec": 30,
        "dtStableMsec": 30,
        "dtSkipMsec": 10
      }
    }    
  },
  "closed": false,
  "folders": {
    "VX Manager": {
      "preset": "Default",
      "closed": false,
      "folders": {
        "camera": {
          "preset": "Default",
          "closed": true,
          "folders": {}
        },
        "tail_0": {
          "preset": "Default",
          "closed": true,
          "folders": {}
        },
        "main_path_2": {
          "preset": "Default",
          "closed": true,
          "folders": {
            "PathCont.": {
              "preset": "Default",
              "closed": true,
              "folders": {}
            }
          }
        },
        "starField_3": {
          "preset": "Default",
          "closed": true,
          "folders": {}
        }
      }
    }
  }
}
}


export var guiPresets_TX = {
  load: {
  "preset": "drop-n-pop-1",
  "remembered": {
    "lat-test": {
      "0": {
        "0": ".3 0 0",
        "3": ".3 0 0",
        "6": ".3 0 0",
        "9": ".3 0 0"
      },
      "1": {
        "0": ".3 0 0",
        "3": ".3 0 0",
        "6": ".3 0 0",
        "9": ".3 0 0"
      }
    },
    "drop-n-pop-1": {
      "0": {
        "0": ".4 -.2 .3",
        "3": ".1 .1 .7",
        "6": ".2 -.15 .1",
        "9": ".2 .1 .3"
      },
      "1": {
        "0": ".15 .18 .2",
        "3": "-.15 -.18 -.1",
        "6": ".1 .22 .2",
        "9": ".0 .2 0"
      }
    }
  },
  "closed": false,
  "folders": {
    "TX": {
      "preset": "Default",
      "closed": true,
      "folders": {
        "gravityToPathDispl_1": {
          "preset": "Default",
          "closed": false,
          "folders": {}
        }
      }
    }
  }
}
}