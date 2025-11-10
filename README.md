# 🚗 Visualizzatore 3D Volkswagen Golf 7 GTD

Un'applicazione web interattiva per visualizzare e personalizzare in 3D una Volkswagen Golf 7 GTD utilizzando Three.js.

![Three.js](https://img.shields.io/badge/Three.js-0.158.0-black?style=flat-square&logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## ✨ Caratteristiche

### 🎨 Personalizzazione Completa
- **Colori carrozzeria**: 4 colori disponibili (Rosso, Bianco, Nero, Grigio)
- **Cerchi**: 3 stili diversi (Scuro, Lucido, Metallico)
- **Interni**: 3 opzioni di colore (Nero, Chiaro, Beige)

### 🚪 Animazioni Interattive
- **Porte**: Apertura/chiusura fluida con animazione realistica
- **Cofano**: Apertura per visualizzare il motore
- **Transizioni smooth**: Tutte le modifiche avvengono con interpolazioni fluide

### 🎮 Controlli Intuitivi
- **Rotazione**: Trascina con il mouse per ruotare il modello
- **Zoom**: Usa la rotella del mouse per avvicinare/allontanare
- **Auto-rotazione**: Il modello ruota automaticamente quando non interagisci

### 💡 Illuminazione Realistica
- Luce emisferica per illuminazione ambientale
- Luce direzionale con ombre dinamiche
- Luci di riempimento per dettagli nelle ombre
- Materiali PBR (Physically Based Rendering) per riflessi realistici

## 📁 Struttura del Progetto

```
/vercel/sandbox/
├── index.html          # Pagina principale HTML
├── styles.css          # Stili CSS con design glass-morphism
├── js/
│   └── main.js        # Script principale Three.js
├── models/
│   └── golf7.gltf     # Modello 3D della Golf 7 GTD (da aggiungere)
└── README.md          # Questo file
```

## 🚀 Come Utilizzare

### 1. Preparazione del Modello 3D

**IMPORTANTE**: Devi inserire il tuo modello 3D della Golf 7 GTD nella cartella `models/`:

```bash
# Copia il tuo file GLTF nella cartella models
cp /percorso/al/tuo/golf7.gltf models/
```

Il file deve essere in formato **GLTF** o **GLB** e chiamarsi `golf7.gltf`.

### 2. Avvio dell'Applicazione

#### Opzione A: Server HTTP Locale (Consigliato)

Poiché l'applicazione carica risorse esterne (Three.js da CDN e il modello GLTF), è necessario un server HTTP:

```bash
# Con Python 3
python3 -m http.server 8000

# Con Node.js (se hai http-server installato)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

Poi apri il browser e vai su: `http://localhost:8000`

#### Opzione B: Aprire Direttamente (Limitato)

Puoi aprire `index.html` direttamente nel browser, ma potrebbero esserci problemi di CORS con il caricamento del modello GLTF.

### 3. Utilizzo dei Controlli

#### 🖱️ Controlli Mouse
- **Rotazione**: Click sinistro + trascina
- **Zoom**: Rotella del mouse
- **Pan**: Click destro + trascina (o Ctrl + click sinistro)

#### 🎨 Pannello Controlli
- **Colore carrozzeria**: Clicca su uno dei 4 colori disponibili
- **Cerchi**: Scegli tra 3 stili diversi
- **Porte**: Apri/chiudi tutte le porte
- **Cofano**: Apri/chiudi il cofano per vedere il motore
- **Interni**: Cambia il colore degli interni

## 🔧 Personalizzazione del Codice

### Modificare i Colori della Carrozzeria

Nel file `index.html`, cerca la sezione `#color-buttons` e modifica i valori `data-color`:

```html
<button data-color="#b30000" title="Rosso">...</button>
<button data-color="#ffffff" title="Bianco">...</button>
<button data-color="#0b0b0b" title="Nero">...</button>
<button data-color="#9b9b9b" title="Grigio">...</button>
```

### Modificare la Velocità di Auto-Rotazione

Nel file `js/main.js`, cerca la variabile `autoRotateSpeed`:

```javascript
const state = {
  // ...
  autoRotateSpeed: 0.0015,  // Aumenta per rotazione più veloce
  // ...
};
```

### Modificare la Posizione della Camera

Nel file `js/main.js`, cerca la configurazione della camera:

```javascript
camera.position.set(4, 1.8, 7);  // X, Y, Z
controls.target.set(0, 0.8, 0);  // Punto di focus
```

### Aggiungere Nuovi Colori per gli Interni

Nel file `js/main.js`, cerca la funzione `applyInteriorColor` e aggiungi nuovi casi:

```javascript
function applyInteriorColor(mode) {
  // ...
  if (mode === 'rosso') {
    targetHex = '#8b0000';  // Rosso scuro
  }
  // ...
}
```

## 🎯 Riconoscimento Automatico delle Parti

Il codice utilizza un sistema intelligente per riconoscere automaticamente le parti del modello 3D basandosi sui nomi dei nodi nel file GLTF:

### Parole Chiave Riconosciute

- **Carrozzeria**: `body`, `carro`, `paint`, `coat`, `exterior`, `shell`
- **Cerchi**: `wheel`, `rim`, `alloy`, `tire`, `ruota`
- **Interni**: `interior`, `seat`, `dashboard`, `inner`, `sedile`
- **Porte**: `door`, `porta`, `porte`
- **Cofano**: `hood`, `bonnet`, `cofano`

### Fallback Automatico

Se il codice non trova parti con questi nomi, utilizza heuristics basate sulle dimensioni e posizioni delle mesh per identificarle automaticamente.

## 🐛 Risoluzione Problemi

### Il modello non si carica

1. **Verifica il percorso**: Assicurati che il file sia in `models/golf7.gltf`
2. **Controlla la console**: Apri gli strumenti sviluppatore (F12) e cerca errori
3. **Formato file**: Verifica che il file sia in formato GLTF valido
4. **Server HTTP**: Usa un server HTTP locale invece di aprire il file direttamente

### Le animazioni non funzionano

1. **Nomi dei nodi**: Il modello deve avere nodi con nomi appropriati (es. "door_left", "hood")
2. **Console log**: Controlla i log nella console per vedere quante parti sono state riconosciute
3. **Modifica manuale**: Puoi modificare le parole chiave nel file `js/main.js`

### Performance scarse

1. **Riduci la qualità delle ombre**: Nel file `js/main.js`, riduci `shadow.mapSize`
2. **Disabilita le ombre**: Imposta `renderer.shadowMap.enabled = false`
3. **Semplifica il modello**: Usa un modello 3D con meno poligoni

### Il pannello controlli non è visibile su mobile

Il pannello si adatta automaticamente su schermi piccoli. Se non è visibile:
1. Controlla che il CSS sia caricato correttamente
2. Verifica che non ci siano errori JavaScript che bloccano il rendering

## 📱 Compatibilità

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile (iOS Safari, Chrome Mobile)

## 🛠️ Tecnologie Utilizzate

- **Three.js 0.158.0**: Libreria 3D WebGL
- **GLTFLoader**: Caricamento modelli GLTF
- **OrbitControls**: Controlli camera interattivi
- **ES6 Modules**: JavaScript moderno
- **CSS3**: Animazioni e glass-morphism
- **Google Fonts**: Font Inter

## 📝 Note Tecniche

### Sistema di Animazione

Le animazioni utilizzano un sistema di **pivot** per simulare cerniere realistiche:
- Ogni porta/cofano ha un pivot posizionato sulla cerniera
- Le rotazioni avvengono attorno al pivot
- Interpolazione smooth con `THREE.MathUtils.lerp()`

### Materiali PBR

I materiali utilizzano il modello **Physically Based Rendering**:
- **Metalness**: Controlla quanto il materiale è metallico (0-1)
- **Roughness**: Controlla la ruvidità della superficie (0-1)
- **Color**: Colore base del materiale

### Illuminazione

Setup illuminazione a 4 luci:
1. **HemisphereLight**: Illuminazione ambientale cielo/terra
2. **DirectionalLight**: Luce principale con ombre
3. **PointLight**: Luce di riempimento per dettagli
4. **DirectionalLight**: Luce posteriore per contorno

## 🤝 Contributi

Sentiti libero di modificare e migliorare il codice! Alcune idee:
- Aggiungere più colori e stili
- Implementare cambio texture
- Aggiungere effetti particellari
- Implementare modalità VR
- Aggiungere suoni per le animazioni

## 📄 Licenza

Questo progetto è fornito "as-is" per scopi educativi e dimostrativi.

## 🙏 Crediti

- **Three.js**: https://threejs.org/
- **Font Inter**: https://fonts.google.com/specimen/Inter
- **Volkswagen Golf 7 GTD**: Modello 3D da fornire dall'utente

---

**Creato con ❤️ usando Three.js**

Per domande o supporto, consulta la documentazione di Three.js: https://threejs.org/docs/
