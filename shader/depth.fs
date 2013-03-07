#ifdef GL_ES
precision highp float;
#endif

void main()
{
    float zbuffer = gl_FragCoord.w * 300.0;
    gl_FragColor = vec4(zbuffer, zbuffer, zbuffer, 1.0);
}
