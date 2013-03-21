var DofDemo = {
    stats: null,

    windowWidth: 0,
    windowHeight: 0,

    renderer: null,
    scene: null,
    camera: null,
    light: null,
    
    clip: {
        near: 1,
        far: 5000,
    },
    
    shader: {
        dofVert: null,
        dofFrag: null,
        
        depthVert: null,
        depthFrag: null
    },
    
    rttTexture: null,
    rttDepth: null,
    rttScene: null,
    rttRender: null,
    rttCamera: null,
    
    material: {
        depth: null,
        
        plane: null,
        box: null
    },
    
    mesh: {
        plane: null,
        box: null,
        dragon: null,
        
        screenPlane: null
    },
    
    mousePressed: false,
    mousePressX: 0,
    mousePressY: 0,
    
    gui: null,
    config: null,
    
    RenderType: {
        ORIGINAL: 0,
        DEPTH: 1,
        DOF: 2
    },
    renderType: 2 // use DOF
};

$(document).ready(function() {
    // container
    DofDemo.windowWidth = $(window).innerWidth();
    DofDemo.windowHeight = $(window).innerHeight();
    
    $(window).resize(function() {
        DofDemo.windowWidth = $(window).innerWidth();
        DofDemo.windowHeight = $(window).innerHeight();
        
        $('#container,canvas').css({
            width: DofDemo.windowWidth, 
            height: DofDemo.windowHeight
        });
        
        DofDemo.material.screen.wSplitCnt = DofDemo.windowWidth;
        DofDemo.material.screen.hSplitCnt = DofDemo.windowHeight;
        
        DofDemo.rttCamera.aspect = DofDemo.windowWidth / DofDemo.windowHeight;
        DofDemo.rttCamera.updateProjectionMatrix();
        
        DofDemo.renderer.setSize(DofDemo.windowWidth, DofDemo.windowHeight);
    })
    
    $('#container').css({
        width: DofDemo.windowWidth, 
        height: DofDemo.windowHeight
    }).mousemove(function(event) {
        if (DofDemo.mousePressed) {
            // rotate camera with mouse dragging
            var dx = event.clientX - DofDemo.mousePressX;
            var da = Math.PI * dx / DofDemo.windowWidth * 0.05;
            var x = DofDemo.rttCamera.position.x;
            var z = DofDemo.rttCamera.position.z;
            var cos = Math.cos(da);
            var sin = Math.sin(da);
            DofDemo.rttCamera.position.x = cos * x - sin * z;
            DofDemo.rttCamera.position.z = sin * x + cos * z;
            DofDemo.rttCamera.lookAt(new THREE.Vector3(0, 250, 0));
        }
    }).mousedown(function(event) {
        DofDemo.mousePressed = true;
        DofDemo.mousePressX = event.clientX;
        DofDemo.mousePressY = event.clientY;
    }).mouseup(function() {
        DofDemo.mousePressed = false;
    });
    
    // loading
    $('#loading').css({'left': (DofDemo.windowWidth - 300) / 2,
            'top': (DofDemo.windowHeight - 200) / 2});
    
    // renderer
    DofDemo.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: $('#canvas')[0],
        preserveDrawingBuffer: true
    });
    DofDemo.renderer.setSize(DofDemo.windowWidth, DofDemo.windowHeight);
    DofDemo.renderer.shadowMapEnabled = true;
    DofDemo.renderer.shadowMapSoft = true;
    DofDemo.renderer.autoClear = false;
    DofDemo.renderer.setClearColor(0x000000);
    
    // scene
    DofDemo.scene = new THREE.Scene();
    // render to target scene
    DofDemo.rttScene = new THREE.Scene();
    
    // render to target camera
    DofDemo.rttCamera = new THREE.PerspectiveCamera(
            60, DofDemo.windowWidth / DofDemo.windowHeight,
            DofDemo.clip.near, DofDemo.clip.far);
    DofDemo.rttCamera.position.set(750, 1000, 750);
    DofDemo.rttCamera.lookAt(new THREE.Vector3(0, 250, 0));
    DofDemo.rttScene.add(DofDemo.rttCamera);
    // camera
    DofDemo.camera = new THREE.OrthographicCamera(-DofDemo.windowWidth / 2,
            DofDemo.windowWidth / 2, DofDemo.windowHeight / 2, 
            -DofDemo.windowHeight / 2, -10000, 10000);
    DofDemo.camera.position.z = 1000;
    DofDemo.scene.add(DofDemo.camera);
    
    // light
    DofDemo.light = new THREE.DirectionalLight(0xffffff, 1.0);
    DofDemo.light.position = DofDemo.rttCamera.position;
    DofDemo.rttScene.add(DofDemo.light);
    // ambient light
    var ambient = new THREE.DirectionalLight(0xcccccc);
    DofDemo.rttScene.add(ambient);
    
    // frame buffer
    initFramebuffer();
    
    // shader
    loadShader();
});

// init frame buffer to get texture and depth data
function initFramebuffer() {
    // texture information in frame buffer
    DofDemo.rttTexture = new THREE.WebGLRenderTarget(DofDemo.windowWidth, 
            DofDemo.windowHeight, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });
    
    // depth information in frame buffer
    DofDemo.rttDepth = new THREE.WebGLRenderTarget(DofDemo.windowWidth, 
            DofDemo.windowHeight, {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });
}

// load vertex shaders and fragment shaders
function loadShader() {
    var loadedCnt = 0;
    var totalCnt = 4; // 4 shaders
    
    function checkAllLoaded() {
        ++loadedCnt;
        if (loadedCnt == totalCnt) {
            initStatus();
            addObjects();
            
            // start rendering
            animate();
        }
    }
    
    $.get('shader/dof.vs', function(data){
        console.log('dof.vs loaded.');
        DofDemo.shader.dofVert = data;
        checkAllLoaded();
    });
    
    $.get('shader/dof.fs', function(data){
        console.log('dof.fs loaded.');
        DofDemo.shader.dofFrag = data;
        checkAllLoaded();
    });
    
    $.get('shader/depth.vs', function(data){
        console.log('depth.vs loaded.');
        DofDemo.shader.depthVert = data;
        checkAllLoaded();
    });
    
    $.get('shader/depth.fs', function(data){
        console.log('depth.fs loaded.');
        DofDemo.shader.depthFrag = data;
        checkAllLoaded();
    });
}

// init status before rendering
function initStatus() {
    // stats
    DofDemo.stats = new Stats();
    DofDemo.stats.domElement.style.position = 'absolute';
    DofDemo.stats.domElement.style.left = '0px';
    DofDemo.stats.domElement.style.top = '0px';
    document.body.appendChild(DofDemo.stats.domElement);
    
    // gui control
    DofDemo.gui = new dat.GUI();
    DofDemo.config = {
        'Render Type': ['Depth of Field', 'z-buffer', 'None'],
        'Max CoC Radius': 10,
        'Focal Length': 500,
        'Focus Distance': 500
    };
    
    // gui event
    DofDemo.gui.add(DofDemo.config, 'Render Type', 
            ['Depth of Field', 'Depth', 'Original'])
        .onChange(function(value) {
            if (value === 'Depth of Field') {
                DofDemo.renderType = DofDemo.RenderType.DOF;
            } else if (value === 'Depth') {
                DofDemo.renderType = DofDemo.RenderType.DEPTH;
            } else {
                DofDemo.renderType = DofDemo.RenderType.ORIGINAL;
            }
            
            // set material to be original texture if is ORGINAL or DOF,
            // set material to be depth texture if is DEPTH
            // material will be set to depth later if is DOF
            if (DofDemo.renderType === DofDemo.RenderType.DEPTH) {
                setMaterial(DofDemo.RenderType.DEPTH);
            } else {
                setMaterial(DofDemo.RenderType.ORIGINAL);
            }
        });
    
    DofDemo.gui.add(DofDemo.config, 'Max CoC Radius', 0, 20)
        .onChange(function(value) {
            DofDemo.material.screen.uniforms.maxCoc.value = value;
        });
        
    DofDemo.gui.add(DofDemo.config, 'Focal Length', 0, 2000);    
    
    DofDemo.gui.add(DofDemo.config, 'Focus Distance', 0, 5000)
        .onChange(function(value) {
            DofDemo.material.screen.uniforms.focusDistance.value = value;
        });
    
    // show render
    $('#loading').fadeOut();
}

// add objects in the scene
function addObjects() {
    // depth material
    DofDemo.material.depth = new THREE.ShaderMaterial({
        uniforms: {
            farmostDepth: {
                type: 'f',
                value: 500
            }
        },
        attributes: {},
        vertexShader: DofDemo.shader.depthVert,
        fragmentShader: DofDemo.shader.depthFrag,
        transparent: true
    });
    
    // plane
    var chessTexture = THREE.ImageUtils.loadTexture('image/chess.jpg');
    chessTexture.wrapS = chessTexture.wrapT = THREE.RepeatWrapping;
    chessTexture.repeat.set(16, 16);
    DofDemo.material.plane = new THREE.MeshLambertMaterial({
        color: 0x666666,
        map: chessTexture
    });
    DofDemo.mesh.plane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000));
    DofDemo.mesh.plane.rotation.x = -Math.PI / 2;
    DofDemo.rttScene.add(DofDemo.mesh.plane);
    
    // boxes
    var pos = [[350, 375, 200], [300, 150, 200], [0, 125, 700], 
            [-400, 250, 300], [-500, 650, 300]];
    var rot = [0, Math.PI / 3, 0, Math.PI / 5, 0];
    var size = [150, 300, 250, 500, 300];
    DofDemo.material.box = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture('image/box.jpg')
    });
    DofDemo.mesh.box = new Array(pos.length);
    for (var i in pos) {
        DofDemo.mesh.box[i] = new THREE.Mesh(
                new THREE.CubeGeometry(size[i] * 1.2, size[i], size[i] * 1.1)
        );
        DofDemo.mesh.box[i].position = new THREE.Vector3(
                pos[i][0], pos[i][1], pos[i][2]);
        DofDemo.mesh.box[i].rotation = new THREE.Vector3(0, rot[i], 0);
        DofDemo.rttScene.add(DofDemo.mesh.box[i]);
    }
    
    // render to target material
    DofDemo.material.screen = new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: 't',
                value: DofDemo.rttTexture
            },
            depth: {
                type: 't',
                value: DofDemo.rttDepth
            },
            
            wSplitCnt: {
                type: 'f',
                value: DofDemo.windowWidth
            },
            hSplitCnt: {
                type: 'f',
                value: DofDemo.windowHeight
            },
            
            // world position which is exactly in focus
            focusDistance: {
                type: 'f',
                value: DofDemo.config['Focus Distance']
            },
            // length of objects in focus
            focalLength: {
                type: 'f',
                value: DofDemo.config['Focal Length']
            },
            
            clipNear: {
                type: 'f',
                value: DofDemo.clip.near
            },
            clipFar: {
                type: 'f',
                value: DofDemo.clip.far
            },
            
            // max CoC, which should not be larger than MAX_RADIUS in dof.fs
            maxCoc: {
                type: 'i',
                value: DofDemo.config['Max CoC Radius']
            }
        },
        vertexShader: DofDemo.shader.dofVert,
        fragmentShader: DofDemo.shader.dofFrag,
        depthWrite: false
    });
    
    // plane to render the final result
    DofDemo.mesh.screenPlane = new THREE.Mesh(    
        new THREE.PlaneGeometry(DofDemo.windowWidth, DofDemo.windowHeight),
        DofDemo.material.screen);
    DofDemo.mesh.screenPlane.position.z = -1000;
    DofDemo.scene.add(DofDemo.mesh.screenPlane);
}

// set object material or shader material
// `renderType` should be either `DofDemo.RenderType.DEPTH` or 
// `DofDemo.RenderType.ORIGINAL`, which is different from `DofDemo.renderType` 
// since this function is called inside `render` function in different steps
function setMaterial(renderType) {
    var target = ['box', 'plane'];
    for (var i in target) {
        var name = target[i];
        if (renderType === DofDemo.RenderType.DEPTH) {
            var material = DofDemo.material.depth;
        } else {
            var material = DofDemo.material[name];
        }
        if (DofDemo.mesh[name] instanceof Array) {
            for (var i in DofDemo.mesh[name]) {
                if (DofDemo.mesh[name][i]) {
                    DofDemo.mesh[name][i].material = material;
                }
            }
        } else {
            DofDemo.mesh[name].material = material;
        }
    }
}

// call in each frame
function animate() {
    DofDemo.stats.begin();
    
    render();
    
    requestAnimationFrame(animate);
    
    DofDemo.stats.end();
}

// render called by animate
function render() {
    DofDemo.renderer.clear();
    
    if (DofDemo.renderType === DofDemo.RenderType.DOF) {
        // render to texture
        setMaterial(DofDemo.RenderType.ORIGINAL);
        DofDemo.renderer.render(DofDemo.rttScene, DofDemo.rttCamera, 
                DofDemo.rttTexture, true);
        
        // render to depth
        setMaterial(DofDemo.RenderType.DEPTH);
        DofDemo.renderer.render(DofDemo.rttScene, DofDemo.rttCamera,
                DofDemo.rttDepth, true);
    
        // render to screen
        DofDemo.renderer.render(DofDemo.scene, DofDemo.camera);
        
    } else {
        // render original or depth once
        DofDemo.renderer.render(DofDemo.rttScene, DofDemo.rttCamera);
    }
}
