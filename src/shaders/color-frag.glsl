uniform vec3 u_albedo;
uniform vec3 u_ambient;
uniform vec3 u_lightPos;
uniform vec3 u_lightCol;
uniform float u_lightIntensity;
uniform float time;


varying float noise;

uniform sampler2D image;

varying vec3 f_position;
varying vec3 f_normal;

void main() {
    vec4 color = texture2D( image, vec2(1, noise));
    
    vec3 norm = f_normal.xyz;
    norm.x *= - 1.0;
    norm.y *= - 1.0;
    norm.z *= - 1.0;
    float d = clamp(dot(norm, normalize(u_lightPos - f_position)), 0.0, 1.0);

    gl_FragColor = vec4(d * color.rgb * u_lightCol * u_lightIntensity + u_ambient, 1.0);
}