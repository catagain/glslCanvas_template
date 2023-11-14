// Author:109950031 陳庠宇 
// Title:BreathingGlow
#ifdef GL_ES
precision mediump float;
#endif
#define NUM_OCTAVES 1
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

float sdMoon(vec2 p, float d, float ra, float rb )
{
    p.y = abs(p.y);
    float a = (ra*ra - rb*rb + d*d)/(2.0*d);
    float b = sqrt(max(ra*ra-a*a,0.0));
    if( d*(p.x*b-p.y*a) > d*d*max(b-p.y,0.0) )
          return length(p-vec2(a,b));
    return max( (length(p          )-ra),
               -(length(p-vec2(d,0))-rb));
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}
float fbm(vec2 x) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}
vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
float fbm2(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*gnoise( uv ); uv = m*uv;          
    f += 0.2500*gnoise( uv ); uv = m*uv;
    f += 0.1250*gnoise( uv ); uv = m*uv;
    f += 0.0625*gnoise( uv ); uv = m*uv;
    return f;
}

float diamond(vec2 P, float size) {
   float x = 1.41421356237/2.0 * (P.x - P.y);
   float y = 1.41421356237/2.0 * (P.x + P.y);
   return min(abs(x), abs(y)) - size/(2.0*1.41421356237);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    vec2 mouse = u_mouse/u_resolution.xy;
    mouse.x *= -u_resolution.x/u_resolution.y;
    mouse = mouse*2.0-1.0;
    
    float pi=3.14159;
    float theta = 2.0*pi*u_time/8.0;
    vec2 point = vec2(sin(theta), cos(theta));
    float dir = dot(point, uv)+0.55;
    
    float fog = fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;
    //float fog2 = fbm2(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;
    
	float breathing=(exp(sin(u_time/3.0*pi)) - 0.36787944)*0.42545906412; 
    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);								//光環大小
    
    vec2 uv_flip=vec2(uv.x, -uv.y);
    float weight = smoothstep(-2.100, 0.000, uv.y); //noise position
    float m_noise = noise(uv_flip*30.000)*-0.188*weight;

    //float lines = diamond(uv_flip +(exp(sin(1.0)) - 0.36787944)*0.42545906412  - breathing*2.0, 0.8);
	float lines = diamond(uv_flip +(exp(sin(1.0)) - 0.36787944)*0.42545906412 + mouse + vec2(2.0,-1.0), 0.8);
    float moon_dist = abs(sdMoon(uv*2.372, -0.096-breathing*0.168, 1.315, 1.148-abs(breathing*0.052))+m_noise);
    //動態呼吸
    float line_dist = abs(lines + m_noise);
    //float breathing=sin(u_time*2.0*pi/4.0)*0.5+0.5;						//option1
     			//option2 正確
    //float strength =(0.2*breathing*dir+0.180);			//[0.2~0.3]			//光暈強度加上動態時間營造呼吸感
    float strength =(0.2*breathing+0.300);			//[0.2~0.3]			//光暈強度加上動態時間營造呼吸感
    float thickness=0.1;//(0.060);			//[0.1~0.2]			//光環厚度 營造呼吸感
    float glow_circle = glow(moon_dist, strength, thickness);
    float glow_lines = glow(lines, strength, thickness);
    gl_FragColor = vec4(vec3(glow_lines+fog)*vec3(1.000,0.678,0.872),1.0);
    //gl_FragColor = vec4((vec3(glow_circle)+fog)*dir*vec3(0.910,0.876,0.849)*0.144,1.0);
}




/*
// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}
float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f  = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
}


void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);                                //光環大小
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.2*breathing+0.180);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.1*breathing+0.084);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(circle_dist, strength, thickness);
    gl_FragColor = vec4((vec3(glow_circle)+fog)*dir*vec3(1.0, 0.5, 0.25),1.0);
}
*/
