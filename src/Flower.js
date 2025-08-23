import * as THREE from "three";

const FLOWER_SIZE = 0.4;

class Flowers extends THREE.Group {
  constructor(userImage, xPos, yPos, zPos) {
    super();
    this.flowers = [];
    this.selected = false;

    const loader = new THREE.TextureLoader();
    loader.load(userImage || "/flowerDefault.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      const imageAspectRatio = texture.image.width / texture.image.height;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uSelected: { value: 0 },
          uBorderColor: { value: new THREE.Color(0xFF0000) },
          uBorderThickness: { value: 0.02 },
          uAlphaThreshold: { value: 0.1 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uSelected;
          uniform vec3 uBorderColor;
          uniform float uBorderThickness;
          uniform float uAlphaThreshold;
          varying vec2 vUv;
      
          void main() {
            vec4 texColor = texture2D(uTexture, vUv);
            if (texColor.a < uAlphaThreshold) discard;
      
            float edge = 0.0;
      
            for (int x = -1; x <= 1; x++) {
              for (int y = -1; y <= 1; y++) {
                vec2 offset = vec2(float(x), float(y)) * uBorderThickness;
                float sampleAlpha = texture2D(uTexture, vUv + offset).a;
                if (sampleAlpha < uAlphaThreshold) {
                  edge = 1.0;
                }
              }
            }
      
            if (uSelected > 0.5 && edge > 0.5) {
              gl_FragColor = vec4(uBorderColor, 1.0);
            } else {
              gl_FragColor = texColor;
            }
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      

      const geometry = new THREE.PlaneGeometry(FLOWER_SIZE, FLOWER_SIZE / imageAspectRatio);
      geometry.translate(0, (FLOWER_SIZE / imageAspectRatio) / 2, 0);

      const flower = new THREE.Mesh(geometry, material);
      flower.position.set(xPos, yPos, zPos);
      flower.initialPosition = flower.position.clone();
      flower.rotation.y = Math.random() * Math.PI;

      this.add(flower);
      this.flowers.push(flower);
    });
  }

  setSelected(isSelected) {
    this.selected = isSelected;
    this.flowers.forEach((flower) => {
      if (flower.material.uniforms) {
        flower.material.uniforms.uSelected.value = isSelected ? 1.0 : 0.0;
      }
    });
  }

  update(time) {
    this.flowers.forEach((flower) => {
      const initialX = flower.initialPosition.x;
      const rotationZ = Math.sin(time * 0.002 + initialX * 2.0) * 0.1;
      flower.rotation.z = rotationZ;
    });
  }
}

export default Flowers;
