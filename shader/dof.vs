// switch on high precision floats
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;

uniform float textRepeat;

void main()
{    
    // passing texture to fragment shader
    vUv = uv * textRepeat;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
