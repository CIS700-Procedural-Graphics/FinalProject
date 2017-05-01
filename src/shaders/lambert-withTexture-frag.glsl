varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;
varying float f_elevation;

uniform vec3 ambientLight;
uniform vec3 lightVec;

vec3 biome(float e)
{
	vec3 LAND = vec3(0.698, 0.31, 0.118);
	vec3 WATER = vec3(0.0, 0.408, 0.847);
	vec3 BEACH = vec3(0.698, 0.31, 0.118);
	vec3 FOREST = vec3(0.698, 0.31, 0.118);
	vec3 JUNGLE = vec3(0.0313, 0.447, 0.149);
	vec3 BELOW_TUNDRA = vec3(0.709, 0.808, 0.608);
	vec3 TUNDRA = vec3(0.62, 0.886, 0.698);
	vec3 SNOW = vec3(0.9746, 0.9746, 0.9746);

	if (e < 0.1) return WATER;
	else if (e < 0.2) return BEACH;
	else if (e < 0.3) return FOREST;
	else if (e < 0.5) return JUNGLE;
	else if (e < 0.7) return BELOW_TUNDRA;
	else if (e < 0.9) return TUNDRA;
	else return SNOW;
}

void main()
{
    vec3 col = biome(f_elevation);

    float absDot = clamp(dot(f_nor, normalize( f_pos -lightVec)), 0.0, 1.0);

    gl_FragColor = vec4( absDot*col, 1.0 );
}
