

Un'applicazione web interattiva per visualizzare e personalizzare in 3D la tua Volkswagen Golf 7 GTD utilizzando Three.js.

![Three.js](https://img.shields.io/badge/Three.js-0.158.0-black?style=flat-square&logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## ✨ Caratteristiche

### 🎨 Personalizzazione Completa
- **Colori carrozzeria**: 4 colori disponibili (Rosso, Bianco, Nero, Grigio)
- **Cerchi**: 3 stili diversi (Scuro, Lucido, Metallico)
- **Interni**: 3 colorazioni (Nero, Chiaro, Beige)

### 🚪 Animazioni Interattive
- Apertura/chiusura porte con animazioni fluide
- Apertura/chiusura cofano per vedere il motore
- Transizioni smooth con interpolazione

### 🎮 Controlli Intuitivi
- **Rotazione**: Click sinistro + trascina
- **Zoom**: Rotella del mouse o pinch su touch
- **Pan**: Click destro + trascina (o due dita su touch)
- **Auto-rotazione**: Attivata automaticamente dopo 4 secondi di inattività

### 💡 Illuminazione Realistica
- Luce emisferica per illuminazione ambientale
- Luce direzionale con ombre dinamiche
- Luci di riempimento e contorno
- Materiali PBR (Physically Based Rendering) per riflessi realistici

### 🎯 Design Moderno
- Interfaccia glass-morphism con effetto blur
- Pannello controlli semi-trasparente
- Design responsive per desktop, tablet e mobile
- Font moderno (Inter da Google Fonts)

## 📁 Struttura del Progetto

```
/vercel/sandbox/
├── index.html          # Pagina principale HTML
├── styles.css          # Stili CSS con glass-morphism
├── js/
│   └── main.js        # Script principale Three.js
└── models/
    └── golf7.gltf     # Modello 3D della Golf 7 GTD (da aggiungere)
```

## 🚀 Come Utilizzare

### 1. Preparazione del Modello 3D

Posiziona il tuo file modello 3D nella cartella `models/`:

```bash
# Assicurati che il file sia nominato correttamente
models/golf7.gltf
```

**Formati supportati**: GLTF (.gltf) o GLB (.glb)

> **Nota**: Se il tuo modello è in formato GLB, modifica il path in `js/main.js` alla riga del loader:
> ```javascript
> loader.load('models/golf7.glb', ...
> ```
### 2. Avvio del Server Locale
Per visualizzare l'applicazione, è necessario un server web locale (a causa delle restrizioni CORS per il caricamento dei modelli).
#### Opzione A: Python (se installato)
```bash
# Python 3
python -m http.server 8000
# Python 2
python -m SimpleHTTPServer 8000
```
#### Opzione B: Node.js con http-server
```bash
# Installa http-server globalmente (una volta sola)
npm install -g http-server
# Avvia il server
http-server -p 8000
```
#### Opzione C: VS Code Live Server
Se usi Visual Studio Code:
1. Installa l'estensione "Live Server"
2. Click destro su `index.html`
3. Seleziona "Open with Live Server"
### 3. Apertura nel Browser
Apri il browser e vai a:
```
http://localhost:8000
```
## 🎮 Guida ai Controlli
### Pannello Controlli
| Controllo | Funzione |
|-----------|----------|
| **🎨 Colore carrozzeria** | Cambia il colore della carrozzeria tra 4 opzioni |
| **⚙️ Cerchi** | Seleziona tra 3 stili di cerchi diversi |
| **🚪 Portiere** | Apri/chiudi le porte dell'auto |
| **🔧 Cofano** | Apri/chiudi il cofano per vedere il motore |
| **🪑 Colori interni** | Cambia il colore degli interni |
### Controlli Mouse/Touch
- **Rotazione**: Click sinistro + trascina (o un dito su touch)
- **Zoom**: Rotella del mouse (o pinch con due dita)
- **Pan**: Click destro + trascina (o due dita su touch)
## 🔧 Personalizzazione del Codice
### Modificare i Colori della Carrozzeria
Modifica l'array dei colori in `index.html`:
```html
<button data-color="#b30000" title="Rosso">Rosso</button>
<button data-color="#ffffff" title="Bianco">Bianco</button>
<!-- Aggiungi altri colori qui -->
```
### Modificare la Velocità di Auto-Rotazione
In `js/main.js`, modifica la proprietà `autoRotateSpeed`:
```javascript
const state = {
  autoRotateSpeed: 0.0015,  // Aumenta per rotazione più veloce
  // ...
};
```
### Modificare l'Illuminazione
In `js/main.js`, sezione illuminazione:
```javascript
// Luce direzionale principale
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(6, 12, 8);  // Modifica posizione
```
### Aggiungere Nuovi Stili di Cerchi
In `js/main.js`, funzione `applyRimStyle`:
```javascript
const styles = {
  style1: { color: 0x111111, metalness: 0.2, roughness: 0.6 },
  style2: { color: 0xf7f7f7, metalness: 0.95, roughness: 0.1 },
  style3: { color: 0x7e7e7e, metalness: 0.75, roughness: 0.25 },
  style4: { color: 0xff0000, metalness: 0.8, roughness: 0.2 }  // Nuovo stile rosso
};
```
## 📝 Note sul Modello 3D
### Nomenclatura delle Parti
Il codice riconosce automaticamente le parti del modello in base ai nomi dei nodi. Per risultati ottimali, assicurati che il tuo modello GLTF abbia nomi che includano:
- **Carrozzeria**: `body`, `paint`, `exterior`, `shell`
- **Cerchi**: `wheel`, `rim`, `alloy`, `tire`
- **Interni**: `interior`, `seat`, `dashboard`
- **Porte**: `door`, `porta`
- **Cofano**: `hood`, `bonnet`, `cofano`
### Fallback Automatico
Se il modello non ha nomi specifici, il codice usa **euristica geometrica** per identificare le parti:
- Cerca mesh piatte e verticali per le porte
- Identifica la mesh più anteriore come cofano
- Questo potrebbe non essere sempre accurato
### Ottimizzazione del Modello
Per prestazioni ottimali:
- Mantieni il numero di poligoni sotto 100k
- Usa texture compresse (JPG invece di PNG quando possibile)
- Considera l'uso di formato GLB (binario) invece di GLTF per file più piccoli
## 🐛 Risoluzione Problemi
### Il modello non si carica
1. **Verifica il path**: Assicurati che il file sia in `models/golf7.gltf`
2. **Controlla la console**: Apri DevTools (F12) e guarda eventuali errori
3. **Server locale**: Assicurati di usare un server web locale, non `file://`
4. **Formato file**: Verifica che il file sia GLTF/GLB valido
### Le parti non vengono riconosciute
1. **Controlla i nomi**: Apri il file GLTF in un editor di testo e verifica i nomi dei nodi
2. **Console log**: Guarda i log nella console per vedere quali parti sono state trovate
3. **Modifica keywords**: Aggiungi le tue parole chiave nell'array `bodyKeywords`, `wheelKeywords`, etc.
### Prestazioni lente
1. **Riduci la qualità delle ombre**: In `js/main.js`, riduci `shadow.mapSize`
2. **Disabilita antialiasing**: Cambia `antialias: false` nel renderer
3. **Ottimizza il modello**: Riduci il numero di poligoni
### Animazioni non fluide
1. **Verifica FPS**: Apri DevTools > Performance per controllare il framerate
2. **Riduci qualità**: Disabilita ombre o riduci la risoluzione del renderer
3. **Controlla pivot**: Assicurati che i pivot siano stati creati correttamente
## 🎨 Personalizzazione Avanzata
### Aggiungere Nuove Animazioni
Esempio per animare il bagagliaio:
```javascript
// In js/main.js, dopo la sezione di caricamento del modello
const trunkParts = [];
findMeshesByNameKeyword(model, 'trunk').forEach(m => {
  if (!trunkParts.includes(m)) trunkParts.push(m);
});
preparePivotsForParts(trunkParts, 'trunk');
function animateTrunk(open = true) {
  const targetAngle = open ? Math.PI / 2.5 : 0;
  trunkParts.forEach(mesh => {
    if (mesh.userData && mesh.userData.pivot) {
      mesh.userData.rotationTarget = targetAngle;
      mesh.userData.animating = true;
    }
  });
}
```
### Aggiungere Effetti Particellari
Per aggiungere effetti come fumo dallo scarico o pioggia:
```javascript
// Crea un sistema di particelle
const particleGeometry = new THREE.BufferGeometry();
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.05,
  transparent: true,
  opacity: 0.6
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);
```
## 📚 Risorse Utili
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [GLTF Viewer Online](https://gltf-viewer.donmccurdy.com/)
- [Blender (per creare/modificare modelli 3D)](https://www.blender.org/)
## 📄 Licenza
Questo progetto è fornito "as-is" per scopi educativi e dimostrativi.
## 🤝 Contributi
Sentiti libero di modificare e migliorare il codice secondo le tue esigenze!
---
**Creato con ❤️ usando Three.js**
 103 changes: 103 additions & 0 deletions103  
index.html
Original file line number	Diff line number	Diff line change
@@ -0,0 +1,103 @@
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Visualizzatore 3D interattivo per Volkswagen Golf 7 GTD - Personalizza colori, cerchi e interni" />
  <title>Volkswagen Golf 7 GTD - Visualizzatore 3D</title>

  <!-- Google Font moderno - Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">

  <!-- Stili del progetto -->
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <!-- Contenitore principale della scena 3D -->
  <div id="viewer">
    <!-- Il canvas WebGL verrà inserito qui automaticamente da Three.js -->

    <!-- Overlay con titolo e pannello controlli -->
    <div id="overlay">
      <!-- Header con titolo -->
      <div id="header">
        <h1>Volkswagen Golf 7 GTD</h1>
        <p class="subtitle">Ruota con il mouse • Usa i controlli per personalizzare</p>
      </div>

      <!-- Pannello laterale con i controlli interattivi -->
      <div id="controls">
        <!-- Sezione: Colore carrozzeria -->
        <section>
          <h2>🎨 Colore carrozzeria</h2>
          <div class="btn-row" id="color-buttons">
            <button data-color="#b30000" title="Rosso" style="background: linear-gradient(135deg, #b30000, #8b0000);">
              <span class="color-preview" style="background: #b30000;"></span>
            </button>
            <button data-color="#ffffff" title="Bianco" style="background: linear-gradient(135deg, #ffffff, #e8e8e8);">
              <span class="color-preview" style="background: #ffffff; border: 1px solid rgba(0,0,0,0.1);"></span>
            </button>
            <button data-color="#0b0b0b" title="Nero" style="background: linear-gradient(135deg, #0b0b0b, #1a1a1a);">
              <span class="color-preview" style="background: #0b0b0b;"></span>
            </button>
            <button data-color="#9b9b9b" title="Grigio" style="background: linear-gradient(135deg, #9b9b9b, #6b6b6b);">
              <span class="color-preview" style="background: #9b9b9b;"></span>
            </button>
          </div>
        </section>

        <!-- Sezione: Cerchi -->
        <section>
          <h2>⚙️ Cerchi</h2>
          <div class="btn-row" id="rim-buttons">
            <button data-rim="style1">Scuro</button>
            <button data-rim="style2">Lucido</button>
            <button data-rim="style3">Metallico</button>
          </div>
        </section>

        <!-- Sezione: Portiere -->
        <section>
          <h2>🚪 Portiere</h2>
          <div class="btn-row">
            <button id="toggle-doors" class="full-width">Apri/Chiudi porte</button>
          </div>
        </section>

        <!-- Sezione: Cofano -->
        <section>
          <h2>🔧 Cofano</h2>
          <div class="btn-row">
            <button id="toggle-hood" class="full-width">Apri/Chiudi cofano</button>
          </div>
        </section>

        <!-- Sezione: Colori interni -->
        <section>
          <h2>🪑 Colori interni</h2>
          <div class="btn-row" id="interior-buttons">
            <button data-interior="black">Nero</button>
            <button data-interior="light">Chiaro</button>
            <button data-interior="beige">Beige</button>
          </div>
        </section>

        <!-- Footer informativo -->
        <section class="footer">
          <small>Modello 3D: models/golf7.gltf</small>
          <small>Powered by Three.js</small>
        </section>
      </div>
    </div>

    <!-- Indicatore di caricamento -->
    <div id="loading">
      <div class="spinner"></div>
      <p>Caricamento modello 3D...</p>
    </div>
  </div>

  <!-- Script principale (ES6 module) -->
  <script type="module" src="js/main.js"></script>
</body>
</html>
 771 changes: 771 additions & 0 deletions771  
js/main.js
Large diffs are not rendered by default.

 7 changes: 7 additions & 0 deletions7  
models/.gitkeep
Original file line number	Diff line number	Diff line change
@@ -0,0 +1,7 @@
# Cartella per il modello 3D

Posiziona qui il tuo file modello 3D della Volkswagen Golf 7 GTD.

Il file deve essere nominato: `golf7.gltf` (o `golf7.glb`)

Se usi un nome diverso, ricorda di modificare il path nel file `js/main.js` alla riga del loader.
 405 changes: 405 additions & 0 deletions405  
styles.css
Original file line number	Diff line number	Diff line change
@@ -0,0 +1,405 @@
/* ============================================
   STILI MODERNI PER VISUALIZZATORE 3D
   Volkswagen Golf 7 GTD
   ============================================ */

/* Variabili CSS per tema scuro elegante */
:root {
  --bg-dark: #071018;
  --bg-gradient-start: #0b0f13;
  --bg-gradient-end: #071018;
  --panel-bg: rgba(20, 24, 28, 0.75);
  --panel-border: rgba(255, 255, 255, 0.08);
  --accent: #5bd6ff;
  --accent-hover: #7ee3ff;
  --glass: rgba(255, 255, 255, 0.04);
  --text: #e6eef6;
  --text-muted: rgba(230, 238, 246, 0.7);
  --shadow: rgba(2, 6, 12, 0.6);
}

/* Reset base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Stili globali */
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ============================================
   CONTENITORE PRINCIPALE SCENA 3D
   ============================================ */
#viewer {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Canvas Three.js occuperà tutto lo spazio */
#viewer canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ============================================
   OVERLAY CON CONTROLLI
   ============================================ */
#overlay {
  position: absolute;
  inset: 0;
  pointer-events: none; /* Permette il click-through al canvas */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 24px;
  gap: 20px;
  z-index: 10;
}

/* Header con titolo */
#header {
  pointer-events: none;
  text-align: left;
}

#header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.8);
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-muted);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
}

/* ============================================
   PANNELLO CONTROLLI (Glass-morphism)
   ============================================ */
#controls {
  pointer-events: auto;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  padding: 20px;
  width: 280px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  box-shadow: 0 8px 32px var(--shadow), 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Scrollbar personalizzata per il pannello */
#controls::-webkit-scrollbar {
  width: 6px;
}

#controls::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 3px;
}

#controls::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

#controls::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Sezioni interne del pannello */
#controls section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

#controls section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

#controls h2 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #dff6ff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   PULSANTI
   ============================================ */
.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

#controls button {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  color: var(--text);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 70px;
}

/* Effetto hover sui pulsanti */
#controls button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(91, 214, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3);
  border-color: rgba(91, 214, 255, 0.3);
  background: linear-gradient(135deg, rgba(91, 214, 255, 0.15), rgba(91, 214, 255, 0.05));
}

#controls button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(91, 214, 255, 0.15);
}

/* Pulsante a larghezza piena */
#controls button.full-width {
  width: 100%;
  flex: none;
}

/* ============================================
   PULSANTI COLORE CARROZZERIA (con anteprima)
   ============================================ */
#color-buttons button {
  width: 56px;
  height: 56px;
  padding: 0;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
  flex: none;
}

#color-buttons button .color-preview {
  position: absolute;
  inset: 4px;
  border-radius: 8px;
  pointer-events: none;
}

#color-buttons button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* ============================================
   FOOTER DEL PANNELLO
   ============================================ */
#controls .footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

#controls .footer small {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ============================================
   INDICATORE DI CARICAMENTO
   ============================================ */
#loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-dark);
  z-index: 100;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.5s ease;
}

#loading.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Spinner animato */
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(91, 214, 255, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

#loading p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

/* Tablet e schermi medi */
@media (max-width: 1024px) {
  #controls {
    width: 260px;
  }

  #header h1 {
    font-size: 24px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  #overlay {
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 16px;
    gap: 12px;
  }

  #header {
    text-align: center;
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
  }

  #header h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  #controls {
    width: calc(100% - 32px);
    max-width: 400px;
    max-height: 50vh;
    padding: 16px;
  }

  #controls h2 {
    font-size: 13px;
  }

  #controls button {
    font-size: 12px;
    padding: 8px 12px;
  }

  #color-buttons button {
    width: 48px;
    height: 48px;
  }
}

/* Schermi molto piccoli */
@media (max-width: 480px) {
  #overlay {
    padding: 12px;
  }

  #controls {
    width: calc(100% - 24px);
    padding: 14px;
  }

  #color-buttons button {
    width: 44px;
    height: 44px;
  }
}

/* ============================================
   ANIMAZIONI AGGIUNTIVE
   ============================================ */

/* Fade-in per il pannello controlli */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#controls {
  animation: fadeInUp 0.6s ease-out;
}

/* Pulse per indicare interattività */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(91, 214, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(91, 214, 255, 0);
  }
}

/* Effetto focus accessibilità */
#controls button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
Footer
