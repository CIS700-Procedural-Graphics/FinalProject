//Reference for fog: http://in2gpu.com/2014/07/22/create-fog-shader/

precision highp float;
uniform vec3 color;

uniform sampler2D image1;
uniform sampler2D image2;

uniform vec3 ambientLight;
uniform vec3 light_position;

uniform float fogSwitch;
uniform vec3 eye_position;
uniform vec3 fogColor;
uniform float fogDensity;
uniform vec3 rimColor;
varying vec4 viewSpace;

varying vec2 f_uv;
varying vec3 f_pos;

void main() 
{
    vec4 texColor = texture2D( image1, f_uv );
    vec3 f_nor = texture2D( image2, f_uv ).rgb;

    vec3 finalColor = vec3(0.0);

    if(fogSwitch == 0.0)
    {
    	finalColor = ambientLight + texColor.rgb;
    }
    else
    {
        //get light an view directions
		vec3 L = normalize( light_position - f_pos);
		vec3 V = normalize( eye_position - f_pos);

		//diffuse lighting
		vec3 diffuse = ambientLight * max(0.0, dot(L, f_nor));
		 
		//rim lighting
		float rim = 1.0 - max(dot(V, f_nor), 0.0);
		rim = smoothstep(0.6, 1.0, rim);
		vec3 finalRim = rimColor * vec3(rim, rim, rim);

		//get all lights and texture
		vec3 f_color = finalRim + ambientLight + texColor.rgb;

	    float dist = length(viewSpace);
	    float f = exp(-fogDensity*dist*fogDensity*dist);
	    f = clamp(f, 0.0, 1.0);

	    finalColor = (1.0-f)*fogColor + f*f_color.rgb;
    }


    // finalColor = float(fogSwitch)*finalColor + (1.0-float(fogSwitch))*texColor.rgb;



    float absDot = clamp(dot(f_nor.rgb, normalize(light_position - f_pos)), 0.0, 1.0);

    gl_FragColor = vec4(  finalColor, 1.0 );	
}