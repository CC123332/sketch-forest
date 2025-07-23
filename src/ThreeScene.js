import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Flowers from "./Flower";

const ThreeScene = ({ userImage, addFlowerEnabled, eraseFlowerEnabled, changeSizeEnabled, onSelectFlower, wasdMode }) => {
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


  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    flowersRef.current.forEach((flower) => {
      scene.add(flower);
    });

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-3, 1, 3);
    camera.lookAt(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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

    const movementSpeed = 0.1;

    const bgLoader = new THREE.TextureLoader();
    bgLoader.load('background.png', (texture) => {
      scene.background = texture;
    });

    const floorGeometry = new THREE.CircleGeometry(30, 64);

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('plane.png');
    
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    floorRef.current = floor;    

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
    const radius = 15;
    const numClouds = 10;
  
    const loader = new THREE.TextureLoader();
    loader.load('cloud.png', (texture) => {
      const cloudMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  
      for (let i = 0; i < numClouds; i++) {
        const angle = (i / numClouds) * Math.PI * 2;
        const y = 5 + Math.random();
  
        const cloud = new THREE.Sprite(cloudMaterial.clone());
        cloud.scale.set(5, 3, 1);
  
        clouds.push({ cloud, angle, y });
        scene.add(cloud);
      }
    });

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


    // Animation loop
    const animate = (time) => {
      requestAnimationFrame(animate);

      if (wasdMode) {
        const direction = new THREE.Vector3();
        if (keys["KeyW"]) direction.z -= 1;
        if (keys["KeyS"]) direction.z += 1;
        if (keys["KeyA"]) direction.x -= 1;
        if (keys["KeyD"]) direction.x += 1;

        if (direction.lengthSq() > 0) {
          direction.normalize();
          const move = new THREE.Vector3(direction.x, 0, direction.z).applyEuler(camera.rotation);
          camera.position.add(move.multiplyScalar(movementSpeed));
        }
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
      clouds.forEach((cloudData) => {
          cloudData.angle -= 0.0005; // Negative value for clockwise
          const x = radius * Math.cos(cloudData.angle);
          const z = radius * Math.sin(cloudData.angle);
  
          cloudData.cloud.position.set(x, cloudData.y, z);
          cloudData.cloud.lookAt(new THREE.Vector3(0, cloudData.y, 0)); // Always look at origin
      });

      // Update all flowers dynamically
      flowersRef.current.forEach((flower) => flower.update(time));

      renderer.render(scene, camera);
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

  // Handle mouse movement for hover effect
  const handleMouseMove = (event) => {
    if ((!addFlowerEnabled && !eraseFlowerEnabled) || !sceneRef.current || !cameraRef.current || !floorRef.current || !hoverCircleRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObject(floorRef.current);
    if (intersects.length > 0) {
      const { x, z } = intersects[0].point;
      hoverCircleRef.current.position.set(x, 0.02, z);
      hoverCircleRef.current.visible = true;
    } else {
      hoverCircleRef.current.visible = false;
    }
  };

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
      const { x, z } = intersects[0].point;
      const newFlower = new Flowers(userImage, x, z);

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

  // Setup event listeners based on modes
  useEffect(() => {
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
  }, [addFlowerEnabled, eraseFlowerEnabled, changeSizeEnabled, userImage]);

  return null;
};

export default ThreeScene;