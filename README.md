# Final Project - Music Visualizer
## CIS700 Procedural Graphics, Spring 2017
## Grace Xu 

Using:
- Web Audio API
- Three.js
- Node.js 
- web-audio-beat-detector

Ideas for visualizations: 
- Basic noise cloud (adapted from HW#1)
- Tempo drives camera control 
- Moving line with perturbations driven by amplitude of music

To-do:
- Be able to pause --> DONE 
	- use spacebar to pause the visualization and music (without getting rid of the baseline visuals)
- Be able to extract useful information from audio file, e.g.: --> DONE
	- frequency
	- amplitude/loudness
	- note?
	- tempo (BPM)
- Have at least 4 different interesting visualizations --> 2/4 DONE 
- ~Implement camera controller or controller that switches between visualizations at appropiate points in the music~
- Implement framework for switching between multiple scenes with their own cameras --> DONE 
	- use '0' and '1' on the keyboard to switch manually between current visualizations 
- Implement automatic switching between visualizations in response to the music --> DONE
- Add color to at least one of the visualizations --> DONE
- Stretch: make and/or use a different custom shader for one of the visualizations
- Stretch: more interesting/aesthetically pleasing visuals

Original design doc: https://docs.google.com/document/d/13P_lAncqpzsyP1C5bAflfCYHUtCnb10DHtbcka17JA4/edit?usp=sharing
Final report: https://docs.google.com/document/d/1I6gvRuBfne61IPXz5KhxU_N4pdzxq6v4I-XEtToPV70/edit?usp=sharing

Useful links: 
- http://stackoverflow.com/questions/153712/creating-music-visualizer
- https://en.wikipedia.org/wiki/Fast_Fourier_transform#Applications
- https://en.wikipedia.org/wiki/Music_visualization
- https://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/
- https://www.npmjs.com/package/web-audio-beat-detector
- https://github.com/notthetup/awesome-webaudio
- http://joesul.li/van/beat-detection-using-web-audio/
- http://stackoverflow.com/questions/21247571/how-to-get-microphone-input-volume-value-with-web-audio-api
- http://stackoverflow.com/questions/345187/math-mapping-numbers
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- https://github.com/willianjusten/awesome-audio-visualization
- http://raathigesh.com/Audio-Visualization-with-Web-Audio-and-ThreeJS/
- https://tonejs.github.io/demos
- https://www.html5rocks.com/en/tutorials/webaudio/intro/
- http://stackoverflow.com/questions/14169317/interpreting-web-audio-api-fft-results
- http://stackoverflow.com/questions/14789283/what-does-the-fft-data-in-the-web-audio-api-correspond-to
- http://www.liutaiomottola.com/formulae/freqtab.htm
- http://chimera.labs.oreilly.com/books/1234000001552/ch03.html#s03_2
- http://chimera.labs.oreilly.com/books/1234000000802/ch04.html#deferred_rendering
- https://threejs.org/examples/webgl_geometry_extrude_splines.html
- http://stemkoski.github.io/Three.js/#viewports-dual
- https://rawgit.com/bellbind/c9d885349db114d98734/raw/spiral.html 

More inspiration:
- http://hughsk.io/popcorn/
- http://mattdesl.github.io/codevember/21.html
- http://www.dennis.video/ 
- https://www.uberviz.io/viz/splice/
- http://jojo.ninja/fluctus/
- http://www.michaelbromley.co.uk/experiments/soundcloud-vis/#griffinmcelroy/sets/the-adventure-zone-ost
- https://tariqksoliman.github.io/Vissonance/