//Reference for fog: http://in2gpu.com/2014/07/22/create-fog-shader/

precision highp float;

uniform sampler2D image1;

uniform vec3 ambientLight;
uniform vec3 lightVec;

uniform float fogSwitch;
uniform vec3 camPos;
uniform vec3 fogColor;
uniform float fogDensity;
uniform vec3 rimColor;
varying vec4 viewSpace;

varying vec2 f_uv;
varying vec3 f_pos;
varying vec3 f_nor;

void main() 
{
    vec4 texColor = texture2D( image1, f_uv );

    vec3 eye_position = camPos;
    vec3 finalColor = vec3(0.0);

	float absDot = clamp(dot(f_nor, normalize(lightVec)), 0.0, 1.0);	

	vec3 finalColor_noFog = absDot*texColor.rgb + ambientLight*texColor.rgb;

	//Fog Calculations
    //get light an view directions
	vec3 L = normalize( lightVec );
	vec3 V = normalize( eye_position - f_pos);

	//diffuse lighting
	vec3 diffuse = ambientLight * max(0.0, dot(L, f_nor));
	 
	//rim lighting
	float rim = 1.0 - max(dot(V, f_nor), 0.0);
	rim = smoothstep(0.6, 1.0, rim);
	vec3 finalRim = rimColor * vec3(rim, rim, rim);

	//get all lights and texture
	vec3 f_color = finalRim + texColor.rgb + ambientLight*texColor.rgb;

    float dist = length(viewSpace);
    float f = exp(-fogDensity*dist*fogDensity*dist);
    f = clamp(f, 0.0, 1.0);

    finalColor = (1.0-f)*fogColor + f*f_color.rgb;
    finalColor = absDot*finalColor;
    
    finalColor = float(fogSwitch)*finalColor + (1.0-float(fogSwitch))*finalColor_noFog;

    gl_FragColor = vec4( finalColor, 1.0 );
}