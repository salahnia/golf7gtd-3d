/* ============================================
   VISUALIZZATORE 3D VOLKSWAGEN GOLF 7 GTD
   Script principale con Three.js
   ============================================ */

// Importazioni da CDN (Three.js, GLTFLoader, OrbitControls)
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';

/* ============================================
   CONFIGURAZIONE INIZIALE SCENA
   ============================================ */

// Riferimento al contenitore principale
const canvasContainer = document.getElementById('viewer');
const loadingScreen = document.getElementById('loading');

// Creazione del renderer WebGL con antialiasing
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  alpha: true 
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// Creazione della scena con sfondo scuro
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);

// Creazione della camera prospettica
const camera = new THREE.PerspectiveCamera(
  45,  // Field of view
  window.innerWidth / window.innerHeight,  // Aspect ratio
  0.1,  // Near clipping plane
  200   // Far clipping plane
);
camera.position.set(4, 1.8, 7);

// Controlli OrbitControls per rotazione con mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Abilita smorzamento per movimento fluido
controls.dampingFactor = 0.08;
controls.minDistance = 2.5;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI / 2 + 0.2;  // Limita rotazione verticale
controls.target.set(0, 0.8, 0);  // Punto di focus

/* ============================================
   ILLUMINAZIONE REALISTICA
   ============================================ */

// Luce emisferica per illuminazione ambientale morbida
const hemisphereLight = new THREE.HemisphereLight(
  0xddeeff,  // Colore cielo (blu chiaro)
  0x222233,  // Colore terra (blu scuro)
  0.6
);
scene.add(hemisphereLight);

// Luce direzionale principale con ombre
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(6, 12, 8);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.bias = -0.0001;
scene.add(directionalLight);

// Luce di riempimento per dettagli nelle ombre
const fillLight = new THREE.PointLight(0xffffff, 0.2);
fillLight.position.set(-6, 4, -6);
scene.add(fillLight);

// Luce posteriore per contorno
const rimLight = new THREE.DirectionalLight(0x5bd6ff, 0.3);
rimLight.position.set(-4, 3, -5);
scene.add(rimLight);

/* ============================================
   PIANO DI APPOGGIO (Ground)
   ============================================ */

const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x061016, 
  metalness: 0.0, 
  roughness: 0.95 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.01;
scene.add(ground);

/* ============================================
   GESTIONE MODELLO 3D (GLTF)
   ============================================ */

const loader = new GLTFLoader();

// Array per raccogliere le diverse parti del modello
const bodyMeshes = [];      // Carrozzeria
const rimMeshes = [];       // Cerchi/ruote
const interiorMeshes = [];  // Interni
const doorParts = [];       // Porte
const hoodParts = [];       // Cofano

// Contenitore root per il modello
const carRoot = new THREE.Object3D();
scene.add(carRoot);

// Stato dell'applicazione
const state = {
  doorsOpen: false,
  hoodOpen: false,
  idleAutoRotate: true,
  lastInteraction: performance.now(),
  autoRotateSpeed: 0.0015,  // Velocità rotazione automatica
  modelLoaded: false
};

/* ============================================
   FUNZIONI DI UTILITÀ
   ============================================ */

/**
 * Trova mesh nel modello che contengono una parola chiave nel nome
 * @param {THREE.Object3D} root - Oggetto radice da cui iniziare la ricerca
 * @param {string} keyword - Parola chiave da cercare (case-insensitive)
 * @returns {Array} Array di mesh trovate
 */
function findMeshesByNameKeyword(root, keyword) {
  const found = [];
  root.traverse((node) => {
    if (node.isMesh && node.name && node.name.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(node);
    }
  });
  return found;
}

/**
 * Centra e scala il modello per adattarlo alla scena
 * @param {THREE.Object3D} rootObj - Oggetto da centrare
 * @param {number} desiredHeight - Altezza desiderata del modello
 */
function centerAndScaleModel(rootObj, desiredHeight = 1.3) {
  // Calcola bounding box del modello
  const box = new THREE.Box3().setFromObject(rootObj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Scala in base all'altezza desiderata
  const scale = desiredHeight / size.y;
  rootObj.scale.setScalar(scale);

  // Riposiziona al livello del suolo e centra
  const box2 = new THREE.Box3().setFromObject(rootObj);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);
  const yMin = box2.min.y;

  rootObj.position.set(-center2.x, -yMin, -center2.z);
}

/**
 * Crea pivot per animare porte e cofano
 * @param {Array} parts - Array di mesh da preparare
 * @param {string} type - Tipo di parte ('door' o 'hood')
 */
function preparePivotsForParts(parts, type) {
  parts.forEach((mesh) => {
    // Se già ha un pivot, salta
    if (mesh.userData.pivot) return;

    // Calcola bounding box della mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Crea pivot (punto di rotazione)
    const parent = mesh.parent || carRoot;
    const pivot = new THREE.Object3D();
    parent.add(pivot);

    // Posiziona il pivot in base al tipo di parte
    let pivotPos = center.clone();

    if (type === 'door') {
      // Per le porte: pivot sul lato esterno
      const side = (center.x > 0) ? 1 : -1;
      pivotPos.x = side === 1 ? box.max.x : box.min.x;
      pivotPos.y = center.y;
      pivotPos.z = center.z;
    } else if (type === 'hood') {
      // Per il cofano: pivot sulla parte posteriore (cerniera)
      pivotPos.x = center.x;
      pivotPos.y = center.y;
      pivotPos.z = box.max.z;
    }

    pivot.position.copy(pivotPos);

    // Salva la matrice world della mesh
    mesh.updateMatrixWorld();
    const worldMatrix = mesh.matrixWorld.clone();

    // Rimuovi la mesh dal parent originale
    parent.remove(mesh);

    // Aggiungi la mesh come figlia del pivot
    pivot.add(mesh);

    // Ricalcola la posizione locale della mesh per mantenere la stessa posizione world
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();

    // Applica la trasformazione inversa del pivot
    const pivotWorldMatrixInverse = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
    const localMatrix = new THREE.Matrix4().multiplyMatrices(pivotWorldMatrixInverse, worldMatrix);
    mesh.applyMatrix4(localMatrix);

    // Salva riferimenti
    mesh.userData.pivot = pivot;
    mesh.userData.type = type;
    mesh.userData.initialRotation = { x: pivot.rotation.x, y: pivot.rotation.y, z: pivot.rotation.z };
  });
}

/**
 * Inizializza materiali PBR per riflessi realistici
 * @param {Array} meshes - Array di mesh da processare
 */
function initMaterials(meshes) {
  meshes.forEach(m => {
    if (m.material) {
      // Clona il materiale per evitare modifiche condivise
      if (Array.isArray(m.material)) {
        m.material = m.material.map(mat => mat.clone());
      } else {
        m.material = m.material.clone();
      }

      // Imposta proprietà PBR per lucentezza auto
      if ('metalness' in m.material) {
        m.material.metalness = m.material.metalness !== undefined ? m.material.metalness : 0.6;
      }
      if ('roughness' in m.material) {
        m.material.roughness = m.material.roughness !== undefined ? m.material.roughness : 0.3;
      }
      m.material.needsUpdate = true;
    }
  });
}

/* ============================================
   CARICAMENTO MODELLO GLTF
   ============================================ */

loader.load(
  'models/golf7.gltf',
  
  // Callback di successo
  (gltf) => {
    console.log('✅ Modello caricato con successo!');
    
    // Pulisci root precedente
    carRoot.clear();

    const model = gltf.scene || gltf.scenes[0];
    
    // Abilita ombre per tutte le mesh
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Aggiungi il modello al root
    carRoot.add(model);

    /* ============================================
       RICONOSCIMENTO AUTOMATICO PARTI
       ============================================ */

    // Carrozzeria (body, paint, exterior)
    const bodyKeywords = ['body', 'carro', 'paint', 'coat', 'exterior', 'shell'];
    bodyKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!bodyMeshes.includes(m)) bodyMeshes.push(m);
      });
    });

    // Cerchi/ruote (wheels, rims)
    const wheelKeywords = ['wheel', 'rim', 'alloy', 'tire', 'ruota'];
    wheelKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!rimMeshes.includes(m)) rimMeshes.push(m);
      });
    });

    // Interni (interior, seats, dashboard)
    const interiorKeywords = ['interior', 'seat', 'dashboard', 'inner', 'sedile'];
    interiorKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!interiorMeshes.includes(m)) interiorMeshes.push(m);
      });
    });

    // Porte (doors)
    const doorKeywords = ['door', 'porta', 'porte'];
    doorKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!doorParts.includes(m)) doorParts.push(m);
      });
    });

    // Cofano (hood, bonnet)
    const hoodKeywords = ['hood', 'bonnet', 'cofano'];
    hoodKeywords.forEach(keyword => {
      findMeshesByNameKeyword(model, keyword).forEach(m => {
        if (!hoodParts.includes(m)) hoodParts.push(m);
      });
    });

    // Fallback: se non troviamo parti specifiche, usa heuristics
    if (bodyMeshes.length === 0) {
      console.warn('⚠️ Nessuna carrozzeria trovata per nome. Usando tutte le mesh grandi come carrozzeria.');
      model.traverse((m) => {
        if (m.isMesh) {
          const box = new THREE.Box3().setFromObject(m);
          const size = new THREE.Vector3();
          box.getSize(size);
          // Mesh grandi probabilmente sono carrozzeria
          if (size.length() > 1.5) {
            bodyMeshes.push(m);
          }
        }
      });
    }

    // Log diagnostico
    console.log('📊 Parti riconosciute:');
    console.log('  - Carrozzeria:', bodyMeshes.length, 'mesh');
    console.log('  - Cerchi:', rimMeshes.length, 'mesh');
    console.log('  - Interni:', interiorMeshes.length, 'mesh');
    console.log('  - Porte:', doorParts.length, 'mesh');
    console.log('  - Cofano:', hoodParts.length, 'mesh');

    // Normalizza e centra il modello
    centerAndScaleModel(carRoot, 1.3);

    // Inizializza materiali PBR
    initMaterials(bodyMeshes);
    initMaterials(rimMeshes);
    initMaterials(interiorMeshes);

    // Prepara pivot per animazioni
    preparePivotsForParts(doorParts, 'door');
    preparePivotsForParts(hoodParts, 'hood');

    // Nascondi schermata di caricamento
    state.modelLoaded = true;
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  },
  
  // Callback di progresso
  (xhr) => {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(`📦 Caricamento: ${Math.round(percentComplete)}%`);
  },
  
  // Callback di errore
  (error) => {
    console.error('❌ Errore caricamento modello:', error);
    const loadingText = loadingScreen.querySelector('p');
    if (loadingText) {
      loadingText.textContent = '❌ Errore: impossibile caricare il modello. Verifica che il file models/golf7.gltf esista.';
      loadingText.style.color = '#ff6b6b';
    }
  }
);

/* ============================================
   ANIMAZIONI PORTE E COFANO
   ============================================ */

/**
 * Anima l'apertura/chiusura delle porte
 * @param {boolean} open - true per aprire, false per chiudere
 */
function animateDoors(open = true) {
  const targetAngle = open ? Math.PI / 2.5 : 0;  // ~72 gradi
  
  doorParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      // Determina direzione in base alla posizione X
      const side = (mesh.userData.pivot.position.x >= 0) ? 1 : -1;
      mesh.userData.rotTarget = side * targetAngle;
      mesh.userData.animating = true;
    }
  });
}

/**
 * Anima l'apertura/chiusura del cofano
 * @param {boolean} open - true per aprire, false per chiudere
 */
function animateHood(open = true) {
  const targetAngle = open ? -Math.PI / 3 : 0;  // ~60 gradi verso l'alto
  
  hoodParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      mesh.userData.rotTarget = targetAngle;
      mesh.userData.animating = true;
    }
  });
}

/* ============================================
   APPLICAZIONE COLORI E STILI
   ============================================ */

/**
 * Applica un colore alla carrozzeria con transizione fluida
 * @param {string} hexColor - Colore in formato hex (#rrggbb)
 */
function applyBodyColor(hexColor) {
  bodyMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    
    // Salva colore corrente e target per interpolazione
    mesh.userData.colorTween = {
      from: mesh.material.color.clone(),
      to: new THREE.Color(hexColor),
      t: 0
    };
  });
}

/**
 * Applica uno stile ai cerchi
 * @param {string} style - Stile da applicare ('style1', 'style2', 'style3')
 */
function applyRimStyle(style) {
  rimMeshes.forEach(mesh => {
    if (!mesh.material) return;
    
    // Definisci proprietà per ogni stile
    let target = { color: new THREE.Color(0x111111), metalness: 0.2, roughness: 0.5 };
    
    if (style === 'style1') {
      // Stile scuro opaco
      target = { color: new THREE.Color(0x0a0a0a), metalness: 0.15, roughness: 0.6 };
    } else if (style === 'style2') {
      // Stile lucido cromato
      target = { color: new THREE.Color(0xf0f0f0), metalness: 0.95, roughness: 0.08 };
    } else if (style === 'style3') {
      // Stile metallico grigio
      target = { color: new THREE.Color(0x7a7a7a), metalness: 0.75, roughness: 0.25 };
    }
    
    mesh.userData.rimTarget = target;
    mesh.userData.rimTweenT = 0;
  });
}

/**
 * Applica un colore agli interni
 * @param {string} mode - Modalità colore ('black', 'light', 'beige')
 */
function applyInteriorColor(mode) {
  interiorMeshes.forEach(mesh => {
    if (!mesh.material || !mesh.material.color) return;
    
    let targetHex = '#0a0a0a';  // Nero di default
    
    if (mode === 'light') {
      targetHex = '#e8e8e8';  // Chiaro
    } else if (mode === 'beige') {
      targetHex = '#d4b896';  // Beige
    }
    
    mesh.userData.interiorTween = {
      from: mesh.material.color.clone(),
      to: new THREE.Color(targetHex),
      t: 0
    };
  });
}

/* ============================================
   SETUP INTERFACCIA UTENTE
   ============================================ */

function setupUI() {
  // Pulsanti colore carrozzeria
  document.querySelectorAll('#color-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const hex = btn.dataset.color;
      applyBodyColor(hex);
      touchInteraction();
    });
  });

  // Pulsanti cerchi
  document.querySelectorAll('#rim-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.rim;
      applyRimStyle(style);
      touchInteraction();
    });
  });

  // Pulsante porte
  document.getElementById('toggle-doors').addEventListener('click', () => {
    state.doorsOpen = !state.doorsOpen;
    animateDoors(state.doorsOpen);
    touchInteraction();
  });

  // Pulsante cofano
  document.getElementById('toggle-hood').addEventListener('click', () => {
    state.hoodOpen = !state.hoodOpen;
    animateHood(state.hoodOpen);
    touchInteraction();
  });

  // Pulsanti interni
  document.querySelectorAll('#interior-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.interior;
      applyInteriorColor(mode);
      touchInteraction();
    });
  });

  // Eventi per disabilitare auto-rotazione durante interazione
  ['pointerdown', 'wheel', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, touchInteraction, { passive: true });
  });

  // Riattiva auto-rotazione dopo 4 secondi di inattività
  setInterval(() => {
    if (performance.now() - state.lastInteraction > 4000) {
      state.idleAutoRotate = true;
    }
  }, 500);
}

/**
 * Registra interazione utente
 */
function touchInteraction() {
  state.lastInteraction = performance.now();
  state.idleAutoRotate = false;
}

// Inizializza UI
setupUI();

/* ============================================
   SISTEMA DI ANIMAZIONE (Tweening)
   ============================================ */

/**
 * Aggiorna tutte le interpolazioni attive
 * @param {number} delta - Tempo trascorso dall'ultimo frame
 */
function updateTweens(delta) {
  const tweenSpeed = 2.5;  // Velocità delle transizioni

  // Interpolazione colore carrozzeria
  bodyMeshes.forEach(mesh => {
    const tw = mesh.userData.colorTween;
    if (tw) {
      tw.t = Math.min(1, tw.t + delta * tweenSpeed);
      mesh.material.color.lerpColors(tw.from, tw.to, tw.t);
      if (tw.t >= 1) delete mesh.userData.colorTween;
    }
  });

  // Interpolazione stile cerchi
  rimMeshes.forEach(mesh => {
    const target = mesh.userData.rimTarget;
    if (target) {
      let t = mesh.userData.rimTweenT || 0;
      t = Math.min(1, t + delta * tweenSpeed);
      mesh.userData.rimTweenT = t;

      // Interpola colore
      const currentColor = mesh.material.color.clone();
      mesh.material.color.lerpColors(currentColor, target.color, delta * tweenSpeed);

      // Interpola metalness e roughness
      if ('metalness' in mesh.material) {
        mesh.material.metalness = THREE.MathUtils.lerp(
          mesh.material.metalness, 
          target.metalness, 
          delta * tweenSpeed
        );
      }
      if ('roughness' in mesh.material) {
        mesh.material.roughness = THREE.MathUtils.lerp(
          mesh.material.roughness, 
          target.roughness, 
          delta * tweenSpeed
        );
      }

      if (t >= 1) {
        delete mesh.userData.rimTarget;
        delete mesh.userData.rimTweenT;
      }
    }
  });

  // Interpolazione colore interni
  interiorMeshes.forEach(mesh => {
    const tw = mesh.userData.interiorTween;
    if (tw) {
      tw.t = Math.min(1, tw.t + delta * tweenSpeed);
      mesh.material.color.lerpColors(tw.from, tw.to, tw.t);
      if (tw.t >= 1) delete mesh.userData.interiorTween;
    }
  });

  // Animazione porte e cofano
  const animSpeed = 3.5;
  [...doorParts, ...hoodParts].forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot && mesh.userData.rotTarget !== undefined) {
      const pivot = mesh.userData.pivot;
      const target = mesh.userData.rotTarget;
      const type = mesh.userData.type;

      if (type === 'door') {
        // Interpola rotazione Y per le porte
        pivot.rotation.y = THREE.MathUtils.lerp(
          pivot.rotation.y, 
          target, 
          delta * animSpeed
        );
        
        // Controlla se l'animazione è completa
        if (Math.abs(pivot.rotation.y - target) < 0.001) {
          pivot.rotation.y = target;
          delete mesh.userData.rotTarget;
          mesh.userData.animating = false;
        }
      } else if (type === 'hood') {
        // Interpola rotazione X per il cofano
        pivot.rotation.x = THREE.MathUtils.lerp(
          pivot.rotation.x, 
          target, 
          delta * animSpeed
        );
        
        // Controlla se l'animazione è completa
        if (Math.abs(pivot.rotation.x - target) < 0.001) {
          pivot.rotation.x = target;
          delete mesh.userData.rotTarget;
          mesh.userData.animating = false;
        }
      }
    }
  });
}

/* ============================================
   RENDER LOOP PRINCIPALE
   ============================================ */

const clock = new THREE.Clock();

/**
 * Ridimensiona il renderer quando la finestra cambia dimensione
 */
function resizeRendererToDisplaySize() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  const canvas = renderer.domElement;
  
  const needResize = canvas.width !== width || canvas.height !== height;
  
  if (needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  
  return needResize;
}

/**
 * Loop di animazione principale
 */
function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();

  // Gestisci ridimensionamento
  resizeRendererToDisplaySize();

  // Auto-rotazione quando inattivo
  if (state.idleAutoRotate && state.modelLoaded) {
    carRoot.rotation.y += state.autoRotateSpeed * delta * 60;
  }

  // Aggiorna interpolazioni
  updateTweens(delta);

  // Aggiorna controlli
  controls.update();

  // Renderizza la scena
  renderer.render(scene, camera);
}

// Avvia il loop di animazione
animate();

/* ============================================
   GESTIONE RIDIMENSIONAMENTO FINESTRA
   ============================================ */

window.addEventListener('resize', () => {
  resizeRendererToDisplaySize();
}, false);

/* ============================================
   LOG INIZIALE
   ============================================ */

console.log('🚗 Visualizzatore 3D Volkswagen Golf 7 GTD');
console.log('📦 Three.js caricato');
console.log('🎮 Controlli: Trascina per ruotare, scroll per zoom');
console.log('⚙️ Usa il pannello laterale per personalizzare');
