precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
attribute vec2 uv;

varying vec3 f_pos;
varying vec3 f_nor;
varying vec2 f_uv;

varying vec4 viewSpace;

void main() 
{
    f_uv = uv;
    f_nor = normal;
    f_pos = (modelViewMatrix * vec4( offset + position, 1.0 )).rgb;

    viewSpace = modelViewMatrix*vec4(offset + position, 1.0);

	gl_Position = projectionMatrix * viewSpace;
}