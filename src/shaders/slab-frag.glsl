varying vec3 f_nor;
varying vec3 f_pos;

uniform vec3 ambientLight;
uniform vec3 albedo;
uniform vec3 lightVec;

uniform float fogSwitch;
uniform vec3 camPos;
uniform vec3 fogColor;
uniform float fogDensity;
uniform vec3 rimColor;
varying vec4 viewSpace;

void main()
{
    vec3 color = albedo;
    vec3 eye_position = camPos;
    vec3 finalColor = vec3(0.0);

    float absDot = clamp(dot(f_nor, normalize(lightVec)), 0.0, 1.0);

    if(fogSwitch == 0.0)
    {
    	finalColor = absDot*albedo + ambientLight*color;
    }
    else
    {
        //get light an view directions
		vec3 L = normalize( lightVec - f_pos);
		vec3 V = normalize( eye_position - f_pos);

		//diffuse lighting
		vec3 diffuse = ambientLight * max(0.0, dot(L, f_nor));
		 
		//rim lighting
		float rim = 1.0 - max(dot(V, f_nor), 0.0);
		rim = smoothstep(0.6, 1.0, rim);
		vec3 finalRim = rimColor * vec3(rim, rim, rim);

		//get all lights and texture 
		vec3 f_color = finalRim + color + ambientLight*color;

	    float dist = length(viewSpace);
	    float f = exp(-fogDensity*dist*fogDensity*dist);
	    f = clamp(f, 0.0, 1.0);

	    finalColor = (1.0-f)*fogColor + f*f_color.rgb;
	    finalColor = absDot*finalColor;
    }

	finalColor = float(fogSwitch)*finalColor + (1.0-float(fogSwitch))*color;

    gl_FragColor = vec4( finalColor , 1.0 );
}
