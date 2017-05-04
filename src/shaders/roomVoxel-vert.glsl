precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec3 offset;
attribute vec3 color;
attribute vec2 uv;

varying vec2 f_uv;
varying vec3 f_color;

void main() 
{
	f_uv = uv;
	f_color = color;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + position, 1.0 );
}