//Reference for fog: http://in2gpu.com/2014/07/22/create-fog-shader/

precision highp float;

uniform vec3 albedo;

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
	vec4 baseColor = vec4(albedo, 1.0);
	vec3 eye_position = camPos;
    vec3 finalColor = vec3(0.0);
    
    float _fogDensity = fogDensity/6.0; 

	float absDot = clamp(dot(f_nor, normalize(lightVec)), 0.0, 1.0);

	vec3 finalColor_noFog = absDot*baseColor.rgb + ambientLight*baseColor.rgb;

	//Fog Calculations
	//get light an view directions
	vec3 L = normalize( lightVec - f_pos);
	vec3 V = normalize( eye_position - f_pos);
	
	//rim lighting
	float rim = 1.0 - max(dot(V, f_nor), 0.0);

	if(absDot < 0.3)
	{
		baseColor.rgb = baseColor.rgb*0.6;
		rim = 0.4;
	}
	
	rim = smoothstep(0.6, 1.0, rim);
	vec3 finalRim = rimColor * vec3(rim, rim, rim);

	//get all lights and texture
	vec3 f_color = finalRim + baseColor.rgb + ambientLight*baseColor.rgb;

	float dist = length(viewSpace);
	float f = exp(-_fogDensity*dist*_fogDensity*dist);
	f = clamp(f, 0.0, 1.0);

	finalColor = (1.0-f)*fogColor + f*f_color.rgb;

	if( dist>75.0 )
	{
		finalColor = fogColor;
	}	
	else
	{
		float t = dist/75.0;
		finalColor = t*fogColor + (1.0-t)*finalColor;
	}

    finalColor = float(fogSwitch)*finalColor + (1.0-float(fogSwitch))*finalColor_noFog;

    gl_FragColor = vec4( finalColor, 1.0 );	
}