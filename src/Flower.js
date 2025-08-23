// Flowers.js
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
          uBorderColor: { value: new THREE.Color(0xff0000) },
          uBorderThickness: { value: 0.02 },
          uAlphaThreshold: { value: 0.1 },
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

            // Cut out fully transparent texels so the quad keeps its shape
            if (texColor.a < uAlphaThreshold) discard;

            // 3x3 neighborhood border detection for selection outline
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
        // IMPORTANT render state for "ghostlike" decorative quads:
        transparent: true,       // blend with background
        depthWrite: false,       // never occlude other objects
        depthTest: true,         // still obey depth of terrain/others
        side: THREE.DoubleSide,  // visible from front and back
      });

      // Opaque things (terrain, props) should render first by default.
      // Draw flowers after them to avoid sorting glitches.
      // You can also set this on each mesh below if you prefer.
      material.needsUpdate = true;

      const geometry = new THREE.PlaneGeometry(FLOWER_SIZE, FLOWER_SIZE / imageAspectRatio);
      // Lift the quad so its base sits on the ground
      geometry.translate(0, (FLOWER_SIZE / imageAspectRatio) / 2, 0);

      const flower = new THREE.Mesh(geometry, material);
      flower.position.set(xPos, yPos, zPos);
      flower.initialPosition = flower.position.clone();
      flower.rotation.y = Math.random() * Math.PI;

      // Ensure it renders after opaque terrain (default terrain is renderOrder 0)
      flower.renderOrder = 2;

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
