varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;

void main()
{
    f_uv = uv;
    f_nor = normal;
    f_pos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
