varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;

varying float f_elevation;
varying float f_moisture;

uniform vec3 ambientLight;
uniform vec3 lightVec;

uniform float fogSwitch;
uniform vec3 camPos;
uniform vec3 fogColor;
uniform float fogDensity;
uniform vec3 rimColor;
varying vec4 viewSpace;

vec3 biome_Gradient(float e, float m)
{
	vec3 OceanDark = vec3(35.0/255.0, 70.0/255.0, 175.0/255.0);
	vec3 OceanLight = vec3(47.0/255.0, 146.0/255.0, 252.0/255.0);

	vec3 Green = vec3(60.0/255.0, 133.0/255.0, 63.0/255.0);
	vec3 SuperLightGreen = vec3(189.0/255.0, 223.0/255.0, 190.0/255.0);
	vec3 Arid = vec3(218.0/255.0, 161.0/255.0, 87.0/255.0);
	vec3 SuperLightArid = vec3(226.0/255.0, 232.0/255.0, 247.0/255.0);

	vec3 returnColor = vec3(0.0);

  	if (e < 0.15)
  	{
  		float t = e/0.15;
		returnColor = (1.0-t)*OceanDark + t*OceanLight;
  	}
	else
	{
		vec3 colorbottom = (0.8-m)*Green + (m+0.2)*Arid;
		vec3 colortop = (0.9-m)*SuperLightGreen + (m+0.1)*SuperLightArid;

		returnColor = (1.25-e)*colorbottom + (e-0.25)*colortop;
	}

  	return returnColor;
}

void main()
{
    vec3 basecolor = biome_Gradient(f_elevation, f_moisture);

    vec3 finalColor_noFog = basecolor.rgb + ambientLight*basecolor.rgb;
	vec3 finalColor = basecolor + ambientLight*basecolor;

	float dist = length(viewSpace);
	float normalizedfogDensity = fogDensity/0.15;

	if( dist>75.0 )
	{
		finalColor = fogColor;
	}
	else if( dist>50.0)
	{
		float t = ((dist-50.0)/25.0)*0.3 + 0.7;
		finalColor = t*fogColor + (1.0-t)*finalColor;
	}
	else 
	{
		float t = dist/50.0;
		t = t + t * normalizedfogDensity;

		if(t>=0.7)
		{
			t = 0.7;
		}

		t += (1.0-f_elevation)*0.15;

		finalColor = (t-0.2)*fogColor + (1.2-t)*finalColor;
	}

    finalColor = float(fogSwitch)*finalColor + (1.0-float(fogSwitch))*finalColor_noFog;

    gl_FragColor = vec4( finalColor, 1.0 );
}
