varying vec3 f_nor;
varying vec3 f_pos;

varying vec4 viewSpace;

void main()
{
    f_nor = normal;
    f_pos = position;

    viewSpace = modelViewMatrix*vec4(position, 1.0);

    gl_Position = projectionMatrix * viewSpace;
}
