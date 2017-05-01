varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;

varying float f_elevation;

vec2 hash( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)),
			  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise2D( vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y)*K1 );
	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = step(a.yx,a.xy);    
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

    return dot( n, vec3(70.0) );	
}

float Elevation( vec3 p )
{
	float total = 0.0;
	float amplitude = 1.0;
	float frequency = 1.0;
	float peak_power = 1.14;

	//Loop over n=4 octaves
	for(int j=0; j< 4; j++)
	{
	  	//sum up all the octaves
	  	vec2 pos = vec2(frequency*p.x, frequency*p.z);
	  	pos = pos/2.0 + 0.5;

	  	total += noise2D(pos) * amplitude;
		frequency *= 2.0;
	  	amplitude *= 0.5;
	}

	total = abs(total);

	float elevation = pow(total, peak_power);

	return elevation;
}


void main()
{
    f_uv = uv;
    f_nor = normal;
    f_pos = position;
    f_pos.y = Elevation( position );
    f_elevation = f_pos.y;
    f_pos.y *= 2.0; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4( f_pos, 1.0 );
}
