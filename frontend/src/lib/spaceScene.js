import * as THREE from "three";

// Imperative Three.js scene (TANPA React Three Fiber) agar kebal terhadap
// babel plugin visual-edits yang menyuntik atribut x-* ke elemen JSX.
// Berisi: starfield + kristal heksagon (motif logo Kubus) + cahaya brand ungu/teal.
export function createSpaceScene(canvas, { lowPower = false, transparent = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    powerPreference: "high-performance",
    alpha: transparent,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.3 : 2));
  if (transparent) renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  if (!transparent) {
    scene.background = new THREE.Color("#05060A");
    scene.fog = new THREE.Fog("#05060A", 9, 22);
  }

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(0, 0, 6);

  // ---- Lights (brand gradient via cahaya berwarna) ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const lights = [
    [0x7c68e1, 140, [6, 5, 5]],
    [0x73d1ad, 110, [-6, -3, 3]],
    [0x4f3e97, 60, [0, 4, -6]],
  ].map(([color, intensity, pos]) => {
    const l = new THREE.PointLight(color, intensity, 0, 2);
    l.position.set(...pos);
    scene.add(l);
    return l;
  });

  // ---- Starfield ----
  const starCount = lowPower ? 1600 : 4200;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 30 + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xcdd3ff,
    size: 0.13,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- Hex crystal (bipyramid) ----
  const disposables = [starGeo, starMat];
  const crystal = new THREE.Group();
  const makeHalf = (y, flip, emissive, wire) => {
    const g = new THREE.Group();
    const cone = new THREE.ConeGeometry(1, 1.85, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x141733,
      metalness: 0.8,
      roughness: 0.2,
      emissive: new THREE.Color(emissive),
      emissiveIntensity: 0.55,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(cone, mat);
    g.add(mesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color: wire,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireMesh = new THREE.Mesh(cone, wireMat);
    wireMesh.scale.setScalar(1.015);
    g.add(wireMesh);

    g.position.y = y;
    if (flip) g.rotation.x = Math.PI;
    disposables.push(cone, mat, wireMat);
    return g;
  };
  crystal.add(makeHalf(0.92, false, "#4F3E97", "#9d8bff"));
  crystal.add(makeHalf(-0.92, true, "#1f6f5c", "#73D1AD"));
  scene.add(crystal);

  const clock = new THREE.Clock();
  let progress = 0;

  const setSize = (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const render = () => {
    const t = clock.getElapsedTime();
    crystal.rotation.y += lowPower ? 0.004 : 0.006;
    crystal.rotation.x = Math.sin(t * 0.3) * 0.12 + progress * 0.7;
    crystal.position.y = Math.sin(t * 1.2) * 0.12;
    crystal.scale.setScalar(1 + progress * 0.28);
    stars.rotation.y += 0.0004;
    camera.position.z = 6 - progress * 1.2;
    renderer.render(scene, camera);
  };

  const dispose = () => {
    disposables.forEach((d) => d.dispose && d.dispose());
    lights.forEach((l) => scene.remove(l));
    renderer.dispose();
  };

  return { setSize, setProgress: (p) => { progress = p; }, render, dispose };
}
