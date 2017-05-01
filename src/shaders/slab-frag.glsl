varying vec3 f_nor;
varying vec3 f_pos;

uniform vec3 ambientLight;
uniform vec3 albedo;
uniform vec3 lightVec;

void main()
{
    vec3 col = albedo;

    float absDot = clamp(dot(f_nor, normalize(f_pos - lightVec)), 0.0, 1.0);

    gl_FragColor = vec4( absDot*col + ambientLight, 1.0 );
}
