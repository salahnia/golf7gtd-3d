// main.js - script principale (module)
// Carica Three.js, GLTFLoader e OrbitControls via CDN e gestisce la scena 3D.

// Importazioni (usando moduli ES da unpkg)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

//
// CONFIGURAZIONE INIZIALE
//
const canvasContainer = document.getElementById('viewer');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// Scena e camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018); // sfondo scuro uniforme

const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 200);
camera.position.set(3.5, 1.6, 6);

// Controlli (OrbitControls)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2;
controls.maxDistance = 20;
controls.target.set(0, 0.7, 0);

// Luce ambientale e direzionale per un'illuminazione realistica
const hemi = new THREE.HemisphereLight(0xddeeff, 0x222233, 0.7);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(5, 10, 7);
dir.castShadow = true;
dir.shadow.camera.left = -6;
dir.shadow.camera.right = 6;
dir.shadow.camera.top = 6;
dir.shadow.camera.bottom = -6;
dir.shadow.mapSize.set(2048, 2048);
scene.add(dir);

// Piccola luce di riempimento per dettagli
const fill = new THREE.PointLight(0xffffff, 0.15);
fill.position.set(-5, 3, -5);
scene.add(fill);

// Ground (riflesso leggero simulato)
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x061016, metalness: 0.0, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.01;
scene.add(ground);

//
// GESTIONE MODELLO (GLTF)
//
const loader = new GLTFLoader();

// Oggetti raccolti per le personalizzazioni
const bodyMeshes = [];     // parti della carrozzeria
const rimMeshes = [];      // cerchi/ruote
const interiorMeshes = []; // interni
const doorParts = [];      // parti riconosciute come porte
let hoodParts = [];        // parti del cofano
let carRoot = new THREE.Object3D(); // radice del modello
scene.add(carRoot);

// Per gestire animazioni di porte/cofano
const state = {
  doorsOpen: false,
  hoodOpen: false,
  idleAutoRotate: true,
  lastInteraction: performance.now(),
  autoRotateSpeed: 0.002, // velocità di rotazione automatica quando inattivo
};

// Funzione di utilità: ricerca ricorsiva per mesh con nome che contiene la parola chiave (case-insensitive)
function findMeshesByNameKeyword(root, keyword) {
  const found = [];
  root.traverse((node) => {
    if (node.isMesh && node.name && node.name.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(node);
    }
  });
  return found;
}

// Carica il modello (sostituisci il path con il tuo file)
loader.load('models/golf7.gltf', (gltf) => {
  // Pulizia di root precedente
  carRoot.clear();

  const model = gltf.scene || gltf.scenes[0];
  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;

      // Forniamo un materiale standard se necessario per garantire controlli
      if (Array.isArray(node.material)) {
        node.material = node.material.map(m => m.clone());
      } else if (node.material) {
        node.material = node.material.clone();
      }
    }
  });

  // Aggiungi il modello sotto carRoot per facilitarne la manipolazione
  carRoot.add(model);

  // Proviamo a trovare le parti principali usando heuristics (nome dei nodi)
  // Carrozzeria (body)
  const possibleBodyKeys = ['body', 'carro', 'paint', 'coat', 'exterior'];
  possibleBodyKeys.forEach(k => {
    findMeshesByNameKeyword(model, k).forEach(m => {
      if (!bodyMeshes.includes(m)) bodyMeshes.push(m);
    });
  });

  // Cerchi/ruote
  const possibleWheelKeys = ['wheel', 'rim', 'alloy', 'wheel_front', 'wheel_rear'];
  possibleWheelKeys.forEach(k => {
    findMeshesByNameKeyword(model, k).forEach(m => {
      if (!rimMeshes.includes(m)) rimMeshes.push(m);
    });
  });

  // Interni
  const possibleInteriorKeys = ['interior', 'seat', 'dashboard', 'seat_front', 'seat_rear', 'inner'];
  possibleInteriorKeys.forEach(k => {
    findMeshesByNameKeyword(model, k).forEach(m => {
      if (!interiorMeshes.includes(m)) interiorMeshes.push(m);
    });
  });

  // Porte
  ['door', 'porte', 'porta'].forEach(k => {
    findMeshesByNameKeyword(model, k).forEach(m => {
      if (!doorParts.includes(m)) doorParts.push(m);
    });
  });

  // Cofano / hood / bonnet
  ['hood', 'bonnet', 'cofano', 'bonnet_front'].forEach(k => {
    findMeshesByNameKeyword(model, k).forEach(m => {
      if (!hoodParts.includes(m)) hoodParts.push(m);
    });
  });

  // Se non troviamo porte o cofano, possiamo provare ad inferire alcune mesh grandi come porte laterali e frontale
  if (doorParts.length === 0) {
    // fallback: trova mesh con larghezza maggiore in asse X rispetto ad Y per tenerle come porte
    model.traverse((m) => {
      if (m.isMesh) {
        const box = new THREE.Box3().setFromObject(m);
        const size = new THREE.Vector3();
        box.getSize(size);
        // Se è sottile in Y e ampia in Z/X, potrebbe essere una porta
        if (size.x > 0.4 && size.y > 0.4 && size.z > 0.05 && size.z < 0.6) {
          doorParts.push(m);
        }
      }
    });
  }

  if (hoodParts.length === 0) {
    // fallback: troviamo la mesh anteriore più vicina all'asse Z negativa
    let candidate = null;
    let minZ = 1e9;
    model.traverse((m) => {
      if (m.isMesh) {
        const box = new THREE.Box3().setFromObject(m);
        const center = new THREE.Vector3();
        box.getCenter(center);
        if (center.z < minZ && center.x > -2 && center.x < 2) {
          minZ = center.z;
          candidate = m;
        }
      }
    });
    if (candidate) hoodParts.push(candidate);
  }

  // Log diagnostico (in console)
  console.log('bodyMeshes', bodyMeshes);
  console.log('rimMeshes', rimMeshes);
  console.log('interiorMeshes', interiorMeshes);
  console.log('doorParts', doorParts);
  console.log('hoodParts', hoodParts);

  // Normalizza e centra il modello
  centerAndScaleModel(carRoot, 1.0);

  // Inicializza i materiali base (metallness/roughness) per dare riflessi lievi
  function initMaterials(meshes) {
    meshes.forEach(m => {
      if (m.material) {
        // Se il materiale supporta metalness/roughness, impostiamo valori per lucentezza auto
        if ('metalness' in m.material) m.material.metalness = m.material.metalness !== undefined ? m.material.metalness : 0.5;
        if ('roughness' in m.material) m.material.roughness = m.material.roughness !== undefined ? m.material.roughness : 0.35;
        m.material.needsUpdate = true;
      }
    });
  }
  initMaterials(bodyMeshes);
  initMaterials(rimMeshes);
  initMaterials(interiorMeshes);

  // Prepara pivot per animare porte e cofano (se necessario)
  preparePivotsForParts(doorParts, 'door');
  preparePivotsForParts(hoodParts, 'hood');

}, undefined, (err) => {
  console.error('Errore caricamento modello:', err);
});

//
// UTILITY: centra e scala il modello per adattarlo alla scena
//
function centerAndScaleModel(rootObj, desiredHeight = 1.2) {
  const box = new THREE.Box3().setFromObject(rootObj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Scala in modo che l'altezza corrisponda a desiredHeight
  const scale = desiredHeight / size.y;
  rootObj.scale.setScalar(scale);

  // Dopo scala, riposiziona al livello del suolo e centra
  const box2 = new THREE.Box3().setFromObject(rootObj);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);
  const yMin = box2.min.y;

  rootObj.position.set(-center2.x, -yMin, -center2.z);
  // Piccola rotazione di default per estetica
  rootObj.rotation.y = 0;
}

//
// PIVOT CREATION: per ogni mesh che rappresenta porte/cofano, creiamo un pivot per ruotare come se fossero attaccate a un cardine
//
function preparePivotsForParts(parts, type) {
  parts.forEach((mesh) => {
    // Se la mesh è già sotto un pivot creato, skip
    if (mesh.userData.pivot) return;

    // Calcola bounding box e punto di rotazione plausibile
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Crea pivot e aggiungi alla stessa parent della mesh
    const parent = mesh.parent || carRoot;
    const pivot = new THREE.Object3D();
    parent.add(pivot);

    // posiziona pivot vicino al bordo della porta/cofano
    // per le porte: pivot sull'asse esterno (X) in relazione alla posizione del centro
    let pivotPos = center.clone();

    if (type === 'door') {
      // Decidi lato in base alla posizione X
      const side = (center.x > 0) ? 1 : -1;
      // Sposta pivot all'estremità laterale del box
      pivotPos.x = side === 1 ? box.max.x : box.min.x;
      pivotPos.y = center.y;
      pivotPos.z = center.z;
    } else if (type === 'hood') {
      // pivot vicino al davanti del veicolo (estremità superiore del box nel lato anteriore)
      pivotPos.x = center.x;
      // posizioniamo il pivot sul bordo posteriore del cofano (verso la parte centrale)
      pivotPos.y = center.y;
      pivotPos.z = box.max.z; // punterà come "cerniera" alla parte posteriore del cofano
    }

    // Posiziona il pivot nello spazio mondo
    pivot.position.copy(pivotPos);

    // Trasferisci la mesh sotto il pivot mantenendo la posizione visiva
    const oldMat = new THREE.Matrix4();
    mesh.updateMatrixWorld();
    oldMat.copy(mesh.matrixWorld);

    // Calcola matrice inversa del pivot per mantenere la stessa posizione locale
    const pivotInvMat = new THREE.Matrix4().getInverse(pivot.matrixWorld);
    mesh.applyMatrix4(pivotInvMat);

    // Ora sposta la mesh come figlio del pivot
    pivot.add(mesh);

    // Salva riferimento per animazioni
    mesh.userData.pivot = pivot;
    mesh.userData.type = type;
  });
}

//
// Funzioni di animazione per porte e cofano
//
function animateDoors(open = true) {
  // Rotazione target in radianti (simulazione)
  const target = open ? Math.PI / 2.6 : 0; // ~70 gradi per apertura
  doorParts.forEach(m => {
    if (m.userData && m.userData.pivot) {
      // Determina direzione di rotazione in base al lato (x del pivot)
      const side = (m.userData.pivot.position.x >= 0) ? 1 : -1;
      // Imposta rotazione target attorno a Y (locale del pivot)
      // Useremo un tween semplice: salviamo target nell'userData e la funzione di update la interpola
      m.userData.rotTarget = side * target;
      m.userData.opening = true;
    }
  });
}

function animateHood(open = true) {
  const target = open ? -Math.PI / 3.2 : 0; // apri verso l'alto (rotazione negativa)
  hoodParts.forEach(m => {
    if (m.userData && m.userData.pivot) {
      m.userData.rotTarget = target;
      m.userData.opening = true;
    }
  });
}

//
// INTERAZIONI UI
//
function setupUI() {
  // Colori carrozzeria
  document.querySelectorAll('#color-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.dataset.color;
      applyBodyColor(hex);
      touch(); // aggiorna timer di attività utente
    });
  });

  // Cerchi
  document.querySelectorAll('#rim-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.rim;
      applyRimStyle(style);
      touch();
    });
  });

  // Porte
  document.getElementById('toggle-doors').addEventListener('click', () => {
    state.doorsOpen = !state.doorsOpen;
    animateDoors(state.doorsOpen);
    touch();
  });

  // Cofano
  document.getElementById('toggle-hood').addEventListener('click', () => {
    state.hoodOpen = !state.hoodOpen;
    animateHood(state.hoodOpen);
    touch();
  });

  // Interni
  document.querySelectorAll('#interior-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.interior;
      applyInteriorColor(mode);
      touch();
    });
  });

  // Interazioni utente: interrompono auto-rotazione temporaneamente
  ['pointerdown', 'wheel', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      state.lastInteraction = performance.now();
      state.idleAutoRotate = false;
    }, { passive: true });
  });

  // Se l'utente non interagisce per 3.5s, riattiva l'auto-rotazione lenta
  setInterval(() => {
    if (performance.now() - state.lastInteraction > 3500) {
      state.idleAutoRotate = true;
    }
  }, 500);
}

//
// APPLICAZIONE COLORI E STILI (transizioni lisce)
//
function applyBodyColor(hex) {
  // Applichiamo il colore con una transizione liscia (lerp)
  bodyMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    const current = mesh.material.color.clone();
    const target = new THREE.Color(hex);
    // memorizza tween info
    mesh.userData.colorTween = {
      from: current,
      to: target,
      t: 0
    };
  });
}

function applyRimStyle(style) {
  // Tre stili semplici: style1 (scuro), style2 (lucido con highlights), style3 (metal grey)
  rimMeshes.forEach(mesh => {
    if (!mesh.material) return;
    mesh.userData.rimStyle = style;
    // impostiamo target metalness/roughness e colore
    let target = { color: new THREE.Color(0x111111), metalness: 0.9, roughness: 0.15 };
    if (style === 'style1') {
      target = { color: new THREE.Color(0x111111), metalness: 0.2, roughness: 0.5 };
    } else if (style === 'style2') {
      target = { color: new THREE.Color(0xf7f7f7), metalness: 0.95, roughness: 0.12 };
    } else if (style === 'style3') {
      target = { color: new THREE.Color(0x7e7e7e), metalness: 0.7, roughness: 0.28 };
    }
    mesh.userData.rimTarget = target;
    mesh.userData.rimTweenT = 0;
  });
}

function applyInteriorColor(mode) {
  interiorMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    let targetHex = '#111111';
    if (mode === 'light') targetHex = '#e5e5e5';
    if (mode === 'beige') targetHex = '#d6bea6';
    mesh.userData.interiorTween = {
      from: mesh.material.color.clone(),
      to: new THREE.Color(targetHex),
      t: 0
    };
  });
}

//
// ANIMAZIONI SEMPLICI: interpolazioni frame-by-frame
//
const clock = new THREE.Clock();

function updateTweens(delta) {
  // Body color tween
  bodyMeshes.forEach(mesh => {
    const tw = mesh.userData.colorTween;
    if (tw) {
      tw.t = Math.min(1, tw.t + delta * 2.0); // durata ~0.5s
      mesh.material.color.lerpColors(tw.from, tw.to, tw.t);
      if (tw.t >= 1) delete mesh.userData.colorTween;
    }
  });

  // Rim style tween
  rimMeshes.forEach(mesh => {
    const t = mesh.userData.rimTweenT;
    const target = mesh.userData.rimTarget;
    if (target) {
      mesh.userData.rimTweenT = Math.min(1, (t || 0) + delta * 2.0);
      const tt = mesh.userData.rimTweenT;
      mesh.material.color.lerpColors(mesh.material.color.clone(), target.color, tt * 0.6);
      if ('metalness' in mesh.material) {
        mesh.material.metalness = THREE.MathUtils.lerp(mesh.material.metalness || 0, target.metalness, tt);
      }
      if ('roughness' in mesh.material) {
        mesh.material.roughness = THREE.MathUtils.lerp(mesh.material.roughness || 1, target.roughness, tt);
      }
      if (tt >= 1) {
        delete mesh.userData.rimTarget;
        delete mesh.userData.rimTweenT;
      }
    }
  });

  // Interior tween
  interiorMeshes.forEach(mesh => {
    const tw = mesh.userData.interiorTween;
    if (tw) {
      tw.t = Math.min(1, tw.t + delta * 1.6);
      mesh.material.color.lerpColors(tw.from, tw.to, tw.t);
      if (tw.t >= 1) delete mesh.userData.interiorTween;
    }
  });

  // Porte e cofano: interpola rotazioni verso rotTarget
  const parts = [...doorParts, ...hoodParts];
  parts.forEach(m => {
    if (m.userData && m.userData.pivot && (m.userData.rotTarget !== undefined)) {
      // rotazione locale attuale
      const pivot = m.userData.pivot;
      // Interpola la rotazione attuale verso target usando lerp
      // Determina asse: per porte ruotiamo attorno a Y locale; per cofano attorno a X locale
      const currentRotY = pivot.rotation.y;
      const currentRotX = pivot.rotation.x;
      const target = m.userData.rotTarget;

      if (m.userData.type === 'door') {
        // lerp su Y
        pivot.rotation.y = THREE.MathUtils.lerp(currentRotY, target, Math.min(1, clock.getDelta() * 6.0));
      } else if (m.userData.type === 'hood') {
        // lerp su X
        pivot.rotation.x = THREE.MathUtils.lerp(currentRotX, target, Math.min(1, clock.getDelta() * 6.0));
      }

      // Se siamo quasi al target, togliamo il flag opening
      if (Math.abs((m.userData.type === 'door' ? pivot.rotation.y : pivot.rotation.x) - target) < 0.001) {
        delete m.userData.rotTarget;
        m.userData.opening = false;
      }
    }
  });
}

//
// RENDER LOOP
//
function resizeRendererToDisplaySize() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  const canvas = renderer.domElement;
  const needResize = canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
                     canvas.height !== Math.floor(height * renderer.getPixelRatio());
  if (needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  return needResize;
}

function touch() {
  state.lastInteraction = performance.now();
  state.idleAutoRotate = false;
}

// Setup UI (dopo definizione funzioni)
setupUI();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Resize
  resizeRendererToDisplaySize();

  // Auto-rotate quando l'utente è inattivo
  if (state.idleAutoRotate) {
    // Ruota lentamente il root del modello
    carRoot.rotation.y += state.autoRotateSpeed * delta * 60; // scala per essere costante
  }

  // Aggiornamenti tween/animazioni
  updateTweens(delta);

  // Aggiorna controlli e renderer
  controls.update();
  renderer.render(scene, camera);
}

animate();

//
// NOTE: funzioni di utilità aggiuntive
//

// Funzione helper per debug: evidenzia un mesh con wireframe
function outlineMesh(mesh) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const clone = new THREE.Mesh(mesh.geometry, mat);
  clone.position.copy(mesh.position);
  clone.quaternion.copy(mesh.quaternion);
  clone.scale.copy(mesh.scale);
  scene.add(clone);
}

// Fine file main.js
// Tutte le funzionalità principali sono commentate e localizzate in italiano.
// Se il modello non ha nomi consistenti, il codice usa heuristics (fall-back) per trovare porte/cofano/cerchi.
// Puoi modificare le "possible*Keys" all'inizio del loader per adattarle al tuo file GLTF.
