#ifdef GL_ES
precision highp float;
#endif

varying vec2 vUv;

uniform sampler2D texture;
uniform sampler2D depth;
uniform float wSplitCnt;
uniform float hSplitCnt;

#define KERNEL_RADIUS 5
#define KERNEL_LENGTH 25

void main() {
    /* Gaussian kernel:
     [0] 1.0/273.0,[1] 4.0/273.0, [2] 7.0/273.0, [3] 4.0/273.0, [4] 1.0/273.0,
     [5] 4.0/273.0,[6] 16.0/273.0,[7] 26.0/273.0,[8] 16.0/273.0,[9] 4.0/273.0,
     [10]7.0/273.0,[11]26.0/273.0,[12]41.0/273.0,[13]26.0/273.0,[14]7.0/273.0,
     [15]4.0/273.0,[16]16.0/273.0,[17]26.0/273.0,[18]16.0/273.0,[19]4.0/273.0,
     [20]1.0/273.0,[21] 4.0/273.0,[22] 7.0/273.0,[23] 4.0/273.0,[24] 1.0/273.0
     */
    float kernel[KERNEL_LENGTH];
    kernel[0] = kernel[4] = kernel[20] = kernel[24] = 1.0/273.0;
    kernel[1] = kernel[3] = kernel[5] = kernel[9] = kernel[15] = kernel[19] 
        = kernel[21] = kernel[23] = 4.0/273.0;
    kernel[2] = kernel[10] = kernel[14] = kernel[22] = 7.0/273.0;
    kernel[6] = kernel[8] = kernel[16] = kernel[18] = 16.0/273.0;
    kernel[7] = kernel[11] = kernel[13] = kernel[17] = 26.0/273.0;
    kernel[12] = 41.0/273.0;
    
    float step_w = 1.0 / wSplitCnt;
    float step_h = 1.0 / hSplitCnt;
    vec2 offset[KERNEL_LENGTH];
    for (int i = 0; i < KERNEL_RADIUS; ++i) {
        for (int j = 0; j < KERNEL_RADIUS; ++j) {
            float w;
            if (i == 0)
                w = -step_w * 2.0;
            else if (i == 1)
                w = -step_w;
            else if (i == 2)
                w = 0.0;
            else if (i == 3)
                w = step_w;
            else
                w = step_w * 2.0;
                
            float h;
            if (j == 0)
                h = -step_h * 2.0;
            else if (j == 1)
                h = -step_h;
            else if (j == 2)
                h = 0.0;
            else if (j == 3)
                h = step_h;
            else
                h = step_h * 2.0;
            
            offset[i * KERNEL_RADIUS + j] = vec2(w, h);
        }
    }
    
    // add origianl texture
    vec4 sum = vec4(0.0);
    
    for (int i = 0; i < KERNEL_LENGTH; ++i) {
        vec4 tmp = texture2D(texture, vUv + offset[i]);
        sum += tmp * kernel[i];
    }
    
    gl_FragColor = sum; //texture2D(texture, vUv);
}