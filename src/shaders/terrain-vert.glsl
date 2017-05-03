uniform vec3 slabCenter;
uniform float slabRadius;

varying vec2 f_uv;
varying vec3 f_nor;
varying vec3 f_pos;

varying float f_elevation;
varying float f_moisture;

// varying vec3 testcolor;

varying vec4 viewSpace;

vec2 hashSimplex( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)),
			  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec2 hashGradient( vec2 x )  // replace this by something better
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}

float noiseSimplex2D( vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y)*K1 );
	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = step(a.yx,a.xy);    
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

	vec3 n = h*h*h*h*vec3( dot(a,hashSimplex(i+0.0)), dot(b,hashSimplex(i+o)), dot(c,hashSimplex(i+1.0)));

    return dot( n, vec3(70.0) );	
}

float noiseGradient2D( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
	
	vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hashGradient( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                     dot( hashGradient( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( hashGradient( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                     dot( hashGradient( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float Elevation( vec3 p )
{
	float total = 0.0;
	float amplitude = 2.5;
	float frequency = 0.3;
	float peak_power = 1.13;

	//Loop over n=4 octaves
	for(int j=0; j< 4; j++)
	{
	  	//sum up all the octaves
	  	vec2 pos = vec2(frequency*p.x, frequency*p.z);
	  	pos = pos/2.0 + 0.5;

	  	total += noiseSimplex2D(pos) * amplitude;
		frequency *= 2.0;
	  	amplitude *= 0.5;
	}

	total = abs(total);

	float elevation = pow(total, peak_power);

	return elevation;
}

float Moisture( vec3 p )
{
	float total = 0.0;
	float amplitude = 2.5;
	float frequency = 0.3;
	float peak_power = 1.14;

	//Loop over n=4 octaves
	for(int j=0; j< 4; j++)
	{
	  	//sum up all the octaves
	  	vec2 pos = vec2(frequency*p.x, frequency*p.z);
	  	pos = pos/2.0 + 0.5;

	  	total += noiseGradient2D(pos) * amplitude;
		frequency *= 2.0;
	  	amplitude *= 0.5;
	}

	total = abs(total);

	float moisture = pow(total, peak_power);

	return moisture;
}

vec3 compNormal( vec3 p )
{
	float offset = 0.01;
	vec3 temp = p;
	temp.x = p.x - offset;
	float slopeNegx = Elevation( temp );
	temp.x = p.x + offset;
	float slopePosx = Elevation( temp );

	temp = p;
	temp.y = p.y - offset;
	float slopeNegy = Elevation( temp );
	temp.y = p.y + offset;
	float slopePosy = Elevation( temp );

	temp = p;
	temp.z = p.z - offset;
	float slopeNegz = Elevation( temp );
	temp.z = p.z + offset;
	float slopePosz = Elevation( temp );

	vec3 nor = vec3(slopePosx - slopeNegx,
					slopePosy - slopeNegy,
					slopePosz - slopeNegz);

	nor = normalize(nor);
	return nor;
}

void main()
{
    f_uv = uv;
    
    f_pos = position;
    
    f_elevation = Elevation( position + slabCenter );
    f_moisture = Moisture( position + slabCenter );

    vec3 center = vec3(0.0, 0.0, 0.0); //center has to be relative to the plain itself, so use origin
    vec3 p = vec3( f_pos.x, 0.0, f_pos.z);

    float absDist = abs(distance(f_pos, center));
    float relDist = absDist/(slabRadius);
	float scaleValue = 1.0-relDist;
    
    f_elevation = f_elevation*scaleValue;
    f_moisture = f_moisture;

    f_pos.y = f_elevation*2.0;
    f_nor = compNormal( f_pos );

    viewSpace = modelViewMatrix*vec4(f_pos, 1.0);

    gl_Position = projectionMatrix * viewSpace;
}
