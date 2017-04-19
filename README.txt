CIS 700 Final Project
Michael Stauffer
Spring 2017

== Overview ==

I'm working on a simple musical rhythm visualizer for my final project. The musical rhythm will be generated from simple live input from the computer keyboard (if latency isn't too great) and also from hard-coded rhythms for testing. If time permits it will read midi files. There are two parts to the visualization: 

1) Rhythm analysis - this will start off simply by assigning impulse responses to notes in a rhythm based on tonality (I'll start with just two tones, low and high) and metric phase. Various responses to the impulse responses will be user-assignable. The responses will perturb the path of some agent, making a curved 3D path, and also to control parameters of visual characteristcis of the agent and the rest of the scene. Different responses will perturb the path from a given baseline in different ways, such as deflecting sideways or upwards, or swining along an arc centered around the baseline.

The responses to impulse will be modeled for simplicity using tweening techniques. This will allow simple modeling of motion dynamics and precise control over timing such that impulse responses can end at precise musical times. A drawback may be less-than-natural looking motion curves. If time permits (seems unlikely for now, but will be persued in the future), responses will be modeled using a PID controller and compared with the use of tweening techniques.

2) The visuals will consist of animating the agent's motion along the path, with procedural elements based on the dynamics of the path (i.e. 1st, 2nd, 3rd derivatives) and in response to the notes themselves. For example I'll work on particles shooting off from the agent as angular acceleration increases, and will investigate an articulating form for the agent that swings with the dynamics of moving along the curve, and color effects based on musical tension/release.

== Milestone 1 ==

If you run the code, you'll need a midi virtual synth running on the system's default virtual midi bus (IAC Bus on Mac). Then if you put the input focus on the render window in your browser, hit 'f' and 'j' to rock out! You'll see basic object info dumped for each note you hit, showing the steps from musical input to 'VisualExpression' creation.

So far I have achieved:

* MIDI output 

After considerable banging-of-my-head-against-the-keyboard while trying to get various JS MIDI modules to work, I ended up using the Web MIDI API that's now a part of JS (thanks Austin, for the help). I have basic MIDI event output in response to computer keyboard input, with sounds played by a virtual synth.

* Most of my framework coded up

I'm developing a framework for my visualization tool that goes beyond the scope of the rhythm analysis and visuals I hope to accomplish by the end of this course. My goal is to structure things well enough that I can continue on with adding interesting features in my spare time without spending much time on boring stuff like framework development. To this end, I've created classes and constructs for these parts of my framwork:

- Sequencer: Coordinates all steps of the system; handles musical timing and MIDI output (from keyboard input beat click). MIDI is currently output in response to only two keyboard keys, 'f' and 'j', which generate a kick drum and snare hit sound, respectively. I don't expect to add other notes at this point, as the musical analysis will be limited to rhythms consisting of two pitches, one 'low' and the other 'high', for simplicity. The rest of the sequencer is not fully implemeneted yet, but remaining parts are simple.

- MusicEvent: Encapsulates a musical event, currently just a note event. Tracks its musical characteristics and timing.

- MusicAnalysis: Performs musical analysis on one or more MusicEvents and generates Musical Expressions in response. Will have user-configurable options.

- MusicalExpression (MX): Encapsulates musical 'expressions' which are ways to interpret one or more musical events/notes. Currently one expression is coded, called 'gravity'. This is generated in response to a MusicalEvent based on its sound, where low (kick drum) is given the quality 'grounding', and high (snare drum) is given the quality 'lifting'.

- ExpressionTranslator: This handles translating (mapping) between MX objects and VisualExpression (VX) objects. As a new MX is generated, it's mapped to a new VX object based on the type of MX. Then for each step of the animation, the Translator will handle all active MX objects and have them update their states as needed, and update their corresponding VX objects when needed. The translator will soon allow user-assignment of translations between available MX and VX objects.

- VisualExpression (VX): This encapsulates code that ends up generating the animation. VX objects can contain renderable geometry, special effects, and paths or parameter curves for other VX objects to follow or use in arbitrary ways. Currently only the basic VX object is coded.

== Milestone 2 Goals ==

- Sequencer: Add start/stop controls and MIDI beat-click output. Manage per-frame flow of the music analysis and expression translation.

- MusicalExpression: Finish details of current implementation of 'gravity'-type MX. Possibly start on a 'expectation'-based MX that analyses several musical events over time. Add some user-definable options and gui controls.

- ExpressionTranslator: Finish details of current implementation.

- VisualExpression: Implement VX types for path-following, for a simple object that can follow a path, and for 'path displacements' that change the course of a path.

In coming years, I imagine I'll be rebuilding all this in Houdini!


