#ifdef GL_ES
precision highp float;
#endif

uniform float farmostDepth;

void main()
{
    float zbuffer = 1.0 - cos(gl_FragCoord.z * gl_FragCoord.w * farmostDepth
            * 3.1416 / 2.0);
    gl_FragColor = vec4(zbuffer, zbuffer, zbuffer, 1.0);
}
