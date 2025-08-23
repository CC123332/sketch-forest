import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import noiseTexturePath from './noise.png';
import modelPath from './terrain2.glb';
import cloudPath from './cloud.glb';
import cloudPath2 from './cloud2.glb';
import cloudPath3 from './cloud3.glb';
import cloudPath4 from './cloud4.glb';
import cloudPath5 from './cloud5.glb';
import cloudPath6 from './cloud6.glb';
import cloudPath7 from './cloud7.glb';
import cloudPath8 from './cloud8.glb';
import cloudPath9 from './cloud9.glb';
import cloudPath10 from './cloud10.glb';
import Flowers from "./Flower";

// outline render
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const ThreeScene = ({ userImage, addFlowerEnabled, eraseFlowerEnabled, changeSizeEnabled, onSelectFlower, wasdMode }) => {
  let composer, effectFXAA, outlinePass;

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const floorRef = useRef(null);
  const flowersRef = useRef([]);
  const hoverCircleRef = useRef(null);
  const movement = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  const playerRef = useRef({
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false
  });


  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    sceneRef.current.background = null;
    flowersRef.current.forEach((flower) => {
      scene.add(flower);
    });

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(6, 2, 10);
    camera.lookAt(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    composer = new EffectComposer( renderer );

    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.visibleEdgeColor.set(0x000000);
    composer.addPass( outlinePass );

    effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    composer.addPass( effectFXAA );

    let controls;
    if (!wasdMode) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.maxDistance = 15;
    }

    // WASD & Mouse look setup
    const keys = {};
    let pitch = 0;
    let yaw = 0;

    const onClick = () => {
      if (wasdMode && renderer.domElement.requestPointerLock) {
        renderer.domElement.requestPointerLock();
      }
    };

    const onMouseMove = (event) => {
      if (wasdMode && document.pointerLockElement === renderer.domElement) {
        yaw -= event.movementX * 0.002;
        pitch -= event.movementY * 0.002;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        const euler = new THREE.Euler(pitch, yaw, 0, "YXZ");
        camera.quaternion.setFromEuler(euler);
      }
    };

    const onKeyDown = (e) => (keys[e.code] = true);
    const onKeyUp = (e) => (keys[e.code] = false);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("click", onClick);

    const movementSpeed = 0.02;

    const gltfloader = new GLTFLoader();
    // Load noise texture
    const noiseTexture = new THREE.TextureLoader().load(noiseTexturePath);
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
    noiseTexture.generateMipmaps = false; // disable mipmaps
    noiseTexture.minFilter = THREE.NearestFilter; // keep sharp
    noiseTexture.magFilter = THREE.NearestFilter; // keep sharp
    gltfloader.load(modelPath, (gltf) => {
      outlinePass.selectedObjects.push(gltf.scene);
      gltf.scene.traverse((child) => {
          if (child.isMesh) {
              const originalMap = child.material.map;
              child.material = new THREE.ShaderMaterial({
                  uniforms: {
                      uMap: { value: originalMap },
                      uNoise: { value: noiseTexture },
                      uTime: { value: 0.0 }
                  },
                  vertexShader: `
                      varying vec2 vUv;
                      void main() {
                          vUv = uv;
                          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                      }
                  `,
                  fragmentShader: `
                      varying vec2 vUv;
                      uniform sampler2D uMap;
                      uniform sampler2D uNoise;
                      uniform float uTime;

                      void main() {
                          vec2 noiseUV = vUv * 2.;
                          vec4 baseColor = texture2D(uMap, vUv);
                          float noiseValue = 1. - texture2D(uNoise, noiseUV).r;

                          // Background white layer
                          vec3 whiteColor = vec3(1.0);

                          // Blend between white (background) and baseColor (foreground)
                          vec3 finalColor = mix(whiteColor, baseColor.rgb, noiseValue);

                          gl_FragColor = vec4(finalColor, 1.0); // Keep alpha fully opaque since it's composited
                      }
                  `,
                  transparent: true
              });

          }
      });
      gltf.scene.scale.set(1.2, 1.2, 1.6);
      scene.add(gltf.scene);
      floorRef.current = gltf.scene;
    });


    // Create red hover circle (indicator)
    const circleGeometry = new THREE.CircleGeometry(0.1, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
    const hoverCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    hoverCircle.rotation.x = -Math.PI / 2;
    hoverCircle.visible = false;
    scene.add(hoverCircle);
    hoverCircleRef.current = hoverCircle;
  

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // Add Cloud Image
    const clouds = [];
    const cloudsMoving = [];
    const radius = 15;
    const numClouds = 10;

    const loader = new GLTFLoader();
    const cloudPaths2 = [
      cloudPath8, cloudPath, cloudPath2, cloudPath3, cloudPath4, cloudPath5,
      cloudPath6, cloudPath7, cloudPath9, cloudPath10,

      cloudPath10, cloudPath8, cloudPath7, cloudPath6, cloudPath5, cloudPath9, cloudPath4, cloudPath3, cloudPath2, cloudPath,
      cloudPath10, cloudPath8, cloudPath7, cloudPath6, cloudPath5, cloudPath9, cloudPath4, cloudPath3, cloudPath2, cloudPath,
      cloudPath8, cloudPath, cloudPath2, cloudPath3, cloudPath4, cloudPath5,
      cloudPath6, cloudPath7, cloudPath9, cloudPath10,
    ]

    for (let j = 0; j < cloudPaths2.length; j++) {
      const path = cloudPaths2[j];

      loader.load(path, (gltf) => {
        const cloudModel = gltf.scene;

        // Apply shader
        cloudModel.traverse((child) => {
          if (child.isMesh) {
            const originalMap = child.material.map;
            child.material = new THREE.ShaderMaterial({
              uniforms: {
                uMap: { value: originalMap },
                uNoise: { value: noiseTexture },
                uTime: { value: 0.0 },
              },
              vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D uMap;
                uniform sampler2D uNoise;
                uniform float uTime;
                void main() {
                  gl_FragColor = vec4(vec3(1.0), 1.0);
                }
              `,
              transparent: true,
            });
          }
        });

        let angle, y, scale, targetArr;

        if (j < 10) {
          // case 1 (first 10 clouds)
          angle = (j / numClouds) * Math.PI * 2;
          y = 3;
          scale = new THREE.Vector3(3, 3, 3);
          targetArr = clouds;
        } else {
          // case 2 (remaining clouds)
          angle = (j / cloudPaths2.length) * Math.PI * 2;
          y = 8 + Math.random() * 20;
          const s = 0.5 + Math.random() * 0.1;
          scale = new THREE.Vector3(s, s, s);
          targetArr = cloudsMoving;
        }

        const cloud = cloudModel.clone();
        cloud.scale.copy(scale);

        if (j < 10) {
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);

          cloud.position.set(x, y, z);
          cloud.lookAt(new THREE.Vector3(0, y, 0)); // Always look at origin
        } 

        targetArr.push({ cloud, angle, y });
        outlinePass.selectedObjects.push(cloud);
        scene.add(cloud);
      });
    }

    // Add Sun Animation
    const sunLoader = new THREE.TextureLoader();
    const sunTextures = [
        sunLoader.load('sun1.png'),
        sunLoader.load('sun2.png'),
        sunLoader.load('sun3.png')
    ];

    let currentSunFrame = 0;
    let lastSunSwitch = 0;
    const sunMaterial = new THREE.SpriteMaterial({ map: sunTextures[0], transparent: true });
    const sunSprite = new THREE.Sprite(sunMaterial);
    sunSprite.scale.set(5, 3, 1);
    sunSprite.position.set(6, 10, -20);
    scene.add(sunSprite);

    const EYE_HEIGHT = 1.6;        // camera height above ground
    const GRAVITY = 18;            // m/s^2-ish
    const MOVE_SPEED = 3.0;        // m/s
    const GROUND_SNAP = 0.6;       // max distance to snap down to ground
    const MAX_SLOPE_DOT = Math.cos(THREE.MathUtils.degToRad(50)); // walkable up to ~50°
    const clock = new THREE.Clock();

    const groundRaycaster = new THREE.Raycaster();
    groundRaycaster.ray.direction.set(0, -1, 0);
    groundRaycaster.far = 100;

    function getGroundHit(worldPos) {
      if (!floorRef.current) return null;

      // cast from above the player to avoid starting inside the mesh on slopes
      const origin = worldPos.clone();
      origin.y += 10;

      groundRaycaster.ray.origin.copy(origin);

      //Recursive set to true because floorRef.current is a group mesh 
      const hits = groundRaycaster.intersectObject(floorRef.current, true);
      if (hits.length === 0) return null;

      // The first hit is the closest
      const hit = hits[0];
      // Compute world-space normal
      const normal = hit.face?.normal
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
        : new THREE.Vector3(0, 1, 0);

      return { point: hit.point, normal };
    }

    // Animation loop
    const animate = (time) => {
      requestAnimationFrame(animate);

      const dt = clock.getDelta();

      if (wasdMode) {
        // Forward = camera look projected onto XZ; Right = perpendicular on ground plane
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;                 // ignore pitch so we walk, not fly
        if (forward.lengthSq() === 0) forward.set(0, 0, -1);
        forward.normalize();

        //Builds a vector pointing right (strafe direction) relative to the direction the camera is facing
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Build desired ground-plane move vector from WASD
        const wishDir = new THREE.Vector3();
        if (keys["KeyW"]) wishDir.add(forward);
        if (keys["KeyS"]) wishDir.sub(forward);
        if (keys["KeyA"]) wishDir.sub(right);
        if (keys["KeyD"]) wishDir.add(right);
        if (wishDir.lengthSq() > 0) wishDir.normalize();

        const player = playerRef.current;
        const horizontalMove = wishDir.multiplyScalar(MOVE_SPEED * dt);
        const nextPos = camera.position.clone().add(horizontalMove);

        if (!player.onGround) player.velocity.y -= GRAVITY * dt;
        nextPos.y += player.velocity.y * dt;

        const ground = getGroundHit(nextPos);
        if (ground) {
          const groundY = ground.point.y;
          const heightOverGround = nextPos.y - groundY;
          const up = new THREE.Vector3(0, 1, 0);
          const walkable = ground.normal.dot(up) >= MAX_SLOPE_DOT;

          if (walkable && Math.abs(heightOverGround - EYE_HEIGHT) <= GROUND_SNAP) {
            //close to ground, normal walk
            nextPos.y = groundY + EYE_HEIGHT;
            player.velocity.y = 0;
            player.onGround = true;
          } else if (heightOverGround < EYE_HEIGHT) {
            //below the ground level
            nextPos.y = groundY + EYE_HEIGHT;
            player.velocity.y = 0;
            player.onGround = walkable;
          } else {
            //in the air
            player.onGround = false;
          }
        } else {
          player.onGround = false;
        }

        camera.position.copy(nextPos);
      } else {
        controls?.update();
      }

      const speed = 0.05;
      const direction = new THREE.Vector3();

      if (movement.current.forward) direction.z -= 1;
      if (movement.current.backward) direction.z += 1;
      if (movement.current.left) direction.x -= 1;
      if (movement.current.right) direction.x += 1;

      if (direction.length() > 0) {
        direction.normalize();

        // Move relative to camera direction
        const move = new THREE.Vector3(direction.x, 0, direction.z);
        move.applyQuaternion(camera.quaternion);
        move.y = 0; // Keep movement on the XZ plane
        camera.position.addScaledVector(move, speed);
      }

      // Sun animation: switch texture every 300ms
      if (time - lastSunSwitch > 300) {
          currentSunFrame = (currentSunFrame + 1) % sunTextures.length;
          sunMaterial.map = sunTextures[currentSunFrame];
          sunMaterial.needsUpdate = true;
          lastSunSwitch = time;
      }

      // Move clouds clockwise
      cloudsMoving.forEach((cloudData, i) => {
          cloudData.angle -= 0.0003; // Negative value for clockwise
          const x = radius * Math.cos(cloudData.angle);
          const z = radius * Math.sin(cloudData.angle);
  
          cloudData.cloud.position.set(x, cloudData.y, z);
          cloudData.cloud.lookAt(new THREE.Vector3(0, cloudData.y, 0)); // Always look at origin
      });

      // Update all flowers dynamically
      flowersRef.current.forEach((flower) => flower.update(time));

      renderer.render(scene, camera);
      composer.render();
    };
    animate();

    return () => {
      document.body.removeChild(renderer.domElement);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
    };
  }, [wasdMode]);

  // Setup event listeners based on modes
  useEffect(() => {
    // Function to add a flower at clicked position
    const addFlowerAtClick = (event) => {
      if (!addFlowerEnabled) return;
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObject(floorRef.current);
      if (intersects.length > 0) {
        const { x, y, z } = intersects[0].point;
        const newFlower = new Flowers(userImage, x, y, z);

        flowersRef.current.push(newFlower);
        sceneRef.current.add(newFlower);
      }
    };

    // Function to erase flowers within 0.1 radius
    const eraseFlowerAtClick = (event) => {
      if (!sceneRef.current || !cameraRef.current || !floorRef.current) return;
    
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
    
      const intersects = raycaster.intersectObject(floorRef.current);
      if (intersects.length > 0) {
        const { x, z } = intersects[0].point;
    
        // Filter out flowers that are within 0.1 radius and remove from scene
        const remainingFlowers = [];
        flowersRef.current.forEach((flower) => {
          const flowerPos = flower.flowers[0].position;
          const dist = Math.hypot(flowerPos.x - x, flowerPos.z - z);
    
          if (dist < 0.1) {
            // Remove from scene
            sceneRef.current.remove(flower);
          } else {
            remainingFlowers.push(flower);
          }
        });
        flowersRef.current = remainingFlowers;
      }
    };

    const handleSelectFlower = (event) => {
      if (!changeSizeEnabled) return;
    
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
    
      const intersected = raycaster.intersectObjects(flowersRef.current.map(f => f.flowers[0]));
      if (intersected.length > 0) {
        const flowerMesh = intersected[0].object;
        const flower = flowersRef.current.find(f => f.flowers[0] === flowerMesh);
    
        // First, reset all borders
        flowersRef.current.forEach(f => f.setSelected(false));
    
        if (flower) {
          flower.setSelected(true); // activate border on selected flower
          onSelectFlower({
            ref: flower,
            scale: flowerMesh.scale.x,
            rotation: THREE.MathUtils.radToDeg(flowerMesh.rotation.y),
            setScale: (newScale) => {
              flower.flowers.forEach((mesh) => mesh.scale.set(newScale, newScale, newScale));
            },
            setRotation: (degrees) => {
              const radians = THREE.MathUtils.degToRad(degrees);
              flower.flowers.forEach((mesh) => mesh.rotation.y = radians);
            }
          });
        }
      }
    };

    // Handle mouse movement for hover effect
    const handleMouseMove = (event) => {
      if (
        (!addFlowerEnabled && !eraseFlowerEnabled) ||
        !sceneRef.current || !cameraRef.current ||
        !floorRef.current || !hoverCircleRef.current
      ) return;

      // Use canvas size if you have it; fallback to window
      const rect = rendererRef?.current?.domElement?.getBoundingClientRect?.();
      const w = rect ? rect.width : window.innerWidth;
      const h = rect ? rect.height : window.innerHeight;
      const left = rect ? rect.left : 0;
      const top = rect ? rect.top : 0;

      const mouse = new THREE.Vector2(
        ((event.clientX - left) / w) * 2 - 1,
        -((event.clientY - top) / h) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // IMPORTANT: recurse into children for tiled/uneven floors
      const intersects = raycaster.intersectObject(floorRef.current, true);

      if (intersects.length > 0) {
        const hit = intersects[0];

        // Position at the hit point with a small offset to avoid z-fighting
        const offset = 0.001;

        // Compute world-space normal
        const normal = hit.face?.normal
          ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
          : new THREE.Vector3(0, 1, 0); // fallback

        const pos = hit.point.clone().addScaledVector(normal, offset);
        hoverCircleRef.current.position.copy(pos);

        // Align the circle to the surface
        // Use the axis that your circle's "front" points to.
        // CircleGeometry faces +Z by default; if yours faces +Y, use (0,1,0) instead.
        const circleFront = new THREE.Vector3(0, 0, 1);
        hoverCircleRef.current.quaternion.setFromUnitVectors(circleFront, normal);

        hoverCircleRef.current.visible = true;
      } else {
        hoverCircleRef.current.visible = false;
      }
    };

    const handleClick = (e) => {
      if (addFlowerEnabled) {
        addFlowerAtClick(e);
      } else if (eraseFlowerEnabled) {
        eraseFlowerAtClick(e);
      } else if (changeSizeEnabled) {
        handleSelectFlower(e);
      }
    };

    if (addFlowerEnabled || eraseFlowerEnabled || changeSizeEnabled) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("click", handleClick);
    } else {
      if (hoverCircleRef.current) hoverCircleRef.current.visible = false;
    }

    if (!changeSizeEnabled) {
      flowersRef.current.forEach(flower => {
        flower.setSelected(false);
      });
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [addFlowerEnabled, eraseFlowerEnabled, changeSizeEnabled, userImage, onSelectFlower]);

  return null;
};

export default ThreeScene;