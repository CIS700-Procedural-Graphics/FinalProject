varying vec3 f_nor;
varying vec3 f_pos;

void main()
{
    f_nor = normal;
    f_pos = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( f_pos, 1.0 );
}
