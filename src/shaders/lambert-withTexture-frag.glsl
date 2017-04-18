varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;

uniform vec3 ambientLight;
uniform vec3 lightVec;
uniform sampler2D image1;

void main()
{
    vec4 texColor = texture2D( image1, f_uv );

    float absDot = clamp(dot(f_nor, normalize(lightVec - f_pos)), 0.0, 1.0);

    gl_FragColor = vec4( absDot * texColor.rgb + ambientLight, 1.0 );
}
