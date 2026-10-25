/**
 * HT37 Watch Face Decompiler & Sprite Extractor
 * Bluetrum AB5681G / FitCloudPro (TBUI & PUSH format) asset parser
 */
(function() {
  'use strict';

  // Inject modal CSS styles
  const styles = `
    .ht37-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 29, 0.85);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .ht37-modal-overlay.hidden { display: none !important; }
    .ht37-modal {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 12px;
      width: 100%;
      max-width: 1100px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .ht37-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #1f2937;
      background: #1a2234;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }
    .ht37-modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #a78bfa;
    }
    .ht37-modal-close {
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .ht37-modal-close:hover { color: #f87171; background: #374151; }
    .ht37-modal-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ht37-dropzone {
      border: 2px dashed #4b5563;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      background: #1e293b;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ht37-dropzone:hover, .ht37-dropzone.dragover {
      border-color: #8b5cf6;
      background: #252e48;
    }
    .ht37-meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      background: #0f172a;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      font-size: 0.85rem;
    }
    .ht37-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #1f2937;
      color: #cbd5e1;
      font-family: monospace;
    }
    .ht37-badge.success { background: #064e3b; color: #6ee7b7; }
    .ht37-badge.warn { background: #78350f; color: #fde68a; }
    .ht37-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #374151;
      padding-bottom: 8px;
    }
    .ht37-tab-btn {
      background: #1f2937;
      color: #9ca3af;
      border: 1px solid transparent;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .ht37-tab-btn.active {
      background: #8b5cf6;
      color: #ffffff;
    }
    .ht37-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 16px;
      max-height: 480px;
      overflow-y: auto;
      padding: 4px;
    }
    .ht37-sprite-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;
    }
    .ht37-canvas-container {
      background: repeating-conic-gradient(#20293a 0% 25%, #18202f 0% 50%) 50% / 16px 16px;
      border: 1px solid #475569;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      width: 100%;
      overflow: hidden;
      padding: 6px;
      box-sizing: border-box;
    }
    .ht37-canvas-container canvas {
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .ht37-sprite-meta {
      width: 100%;
      font-size: 0.75rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: monospace;
    }
    .ht37-btn-row {
      display: flex;
      gap: 6px;
      width: 100%;
    }
    .ht37-action-btn {
      flex: 1;
      padding: 4px 8px;
      background: #374151;
      color: #e5e7eb;
      border: 1px solid #4b5563;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 500;
      text-align: center;
    }
    .ht37-action-btn:hover { background: #4b5563; color: #fff; }
    .ht37-probe-panel {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 16px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 14px;
    }
    .ht37-probe-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 0.85rem;
    }
    .ht37-probe-controls label {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
    }
    .ht37-probe-controls input, .ht37-probe-controls select {
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .ht37-hex-view {
      font-family: monospace;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      color: #a5b4fc;
      font-size: 0.75rem;
      line-height: 1.4;
      max-height: 380px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Decompiler Controller & State
  const HT37Decompiler = {
    fileData: null,
    fileName: '',
    fileSize: 0,
    sprites: [],
    swapBytesDefault: false,

    openModal() {
      let modal = document.getElementById('ht37DecompilerModal');
      if (!modal) {
        this.injectModal();
        modal = document.getElementById('ht37DecompilerModal');
      }
      modal.classList.remove('hidden');
    },

    closeModal() {
      const modal = document.getElementById('ht37DecompilerModal');
      if (modal) modal.classList.add('hidden');
    },

    injectModal() {
      const modalHtml = `
        <div id="ht37DecompilerModal" class="ht37-modal-overlay hidden">
          <div class="ht37-modal">
            <div class="ht37-modal-header">
              <div class="ht37-modal-title">
                <span>🔬</span>
                <span>HT37 Dial Asset Decompiler (.bin / .pgl)</span>
              </div>
              <button class="ht37-modal-close" id="ht37CloseBtn">&times;</button>
            </div>
            <div class="ht37-modal-body">
              <div class="ht37-dropzone" id="ht37Dropzone">
                <p style="margin:0 0 8px 0; font-size:1.05rem; font-weight:600; color:#e2e8f0;">
                  Drag & Drop .bin or .pgl Watch Face File Here
                </p>
                <p style="margin:0; font-size:0.85rem; color:#94a3b8;">
                  or click to browse from your device
                </p>
                <input type="file" id="ht37FileInput" accept=".bin,.pgl,.tbui,.push,*" style="display:none;" />
              </div>

              <div class="ht37-meta-bar" id="ht37MetaBar" style="display:none;">
                <span class="ht37-badge" id="ht37BadgeName">File: None</span>
                <span class="ht37-badge" id="ht37BadgeSize">Size: 0 B</span>
                <span class="ht37-badge" id="ht37BadgeLimit">Limit: 524 KB</span>
                <span class="ht37-badge" id="ht37BadgeFormat">Format: Unknown</span>
                <span class="ht37-badge" id="ht37BadgeSprites">Sprites: 0</span>
                <button class="ht37-action-btn" id="ht37BtnToggleSwap" style="margin-left:auto; max-width:170px;">
                  🔄 Byte-Swap (5681 Fix): OFF
                </button>
              </div>

              <div class="ht37-tabs">
                <button class="ht37-tab-btn active" data-tab="gallery">Extracted Sprites (<span id="ht37TabCount">0</span>)</button>
                <button class="ht37-tab-btn" data-tab="probe">Interactive Raster Probe</button>
                <button class="ht37-tab-btn" data-tab="hex">Header / Hex Inspector</button>
                <button class="ht37-action-btn" id="ht37BtnDownloadAll" style="margin-left:auto; max-width:160px; display:none;">
                  💾 Download All Sprites
                </button>
              </div>

              <!-- Tab 1: Sprites Gallery -->
              <div id="ht37TabGallery">
                <div class="ht37-gallery-grid" id="ht37GalleryGrid">
                  <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
                    No watch face file loaded yet. Please select a .bin or .pgl file above.
                  </div>
                </div>
              </div>

              <!-- Tab 2: Raster Probe -->
              <div id="ht37TabProbe" style="display:none;">
                <div class="ht37-probe-panel">
                  <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                    <div class="ht37-canvas-container" style="min-height:360px; width:360px;">
                      <canvas id="ht37ProbeCanvas" width="360" height="360"></canvas>
                    </div>
                    <button class="ht37-action-btn" id="ht37BtnCaptureProbe" style="background:#8b5cf6; padding:8px 16px; font-size:0.85rem; font-weight:600;">
                      ➕ Capture Probe Sprite to Gallery
                    </button>
                  </div>
                  <div class="ht37-probe-controls">
                    <div>
                      <label>Resolution Preset:</label>
                      <select id="ht37ProbePreset" style="width:100%; margin-top:4px;">
                        <option value="360,360">360 × 360 (HT37 Native Circular Background)</option>
                        <option value="180,180">180 × 180 (Sub-Dial)</option>
                        <option value="120,120">120 × 120 (Dial Widget)</option>
                        <option value="80,80">80 × 80 (Icon Large)</option>
                        <option value="48,48">48 × 48 (Icon Small)</option>
                        <option value="32,32">32 × 32 (Status Icon)</option>
                        <option value="24,48">24 × 48 (Digital Clock Digit)</option>
                        <option value="32,64">32 × 64 (Digital Clock Large Digit)</option>
                        <option value="custom">Custom Dimensions</option>
                      </select>
                    </div>
                    <div style="display:flex; gap:10px;">
                      <div style="flex:1;">
                        <label>Width:</label>
                        <input type="number" id="ht37ProbeWidth" value="360" min="1" max="1000" style="width:100%; margin-top:4px;" />
                      </div>
                      <div style="flex:1;">
                        <label>Height:</label>
                        <input type="number" id="ht37ProbeHeight" value="360" min="1" max="1000" style="width:100%; margin-top:4px;" />
                      </div>
                    </div>
                    <div>
                      <label>Color Format:</label>
                      <select id="ht37ProbeFormat" style="width:100%; margin-top:4px;">
                        <option value="rgb565_le">RGB565 (Little Endian / ARM Standard)</option>
                        <option value="rgb565_be">RGB565 (Big Endian / 5681 Swapped)</option>
                        <option value="argb4444">ARGB4444 (Alpha + 12-bit Color)</option>
                        <option value="argb8888">ARGB8888 (32-bit Full Alpha)</option>
                        <option value="alpha8">8-bit Alpha Mask</option>
                      </select>
                    </div>
                    <div>
                      <label><span>File Byte Offset:</span> <span id="ht37ProbeOffsetLabel" style="color:#a78bfa;">0x000000 (0)</span></label>
                      <input type="range" id="ht37ProbeOffsetSlider" min="0" max="100" value="0" style="width:100%; margin-top:4px;" />
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                      <button class="ht37-action-btn" data-step="-1024">-1 KB</button>
                      <button class="ht37-action-btn" data-step="-64">-64 B</button>
                      <button class="ht37-action-btn" data-step="-2">-2 B</button>
                      <button class="ht37-action-btn" data-step="2">+2 B</button>
                      <button class="ht37-action-btn" data-step="64">+64 B</button>
                      <button class="ht37-action-btn" data-step="1024">+1 KB</button>
                    </div>
                    <div>
                      <label><input type="checkbox" id="ht37ProbeChromaKey" checked /> Chroma Key (0x0000 = Transparent)</label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tab 3: Hex Inspector -->
              <div id="ht37TabHex" style="display:none;">
                <div class="ht37-hex-view" id="ht37HexOutput">Load a file to inspect binary header and structure...</div>
              </div>
            </div>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div.firstElementChild);

      this.bindEvents();
    },

    bindEvents() {
      const modal = document.getElementById('ht37DecompilerModal');
      const closeBtn = document.getElementById('ht37CloseBtn');
      const dropzone = document.getElementById('ht37Dropzone');
      const fileInput = document.getElementById('ht37FileInput');
      const swapBtn = document.getElementById('ht37BtnToggleSwap');
      const downloadAllBtn = document.getElementById('ht37BtnDownloadAll');

      closeBtn.addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

      // Dropzone handling
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          this.loadFile(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          this.loadFile(e.target.files[0]);
        }
      });

      // Tabs
      document.querySelectorAll('.ht37-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.ht37-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.tab;
          document.getElementById('ht37TabGallery').style.display = tab === 'gallery' ? 'block' : 'none';
          document.getElementById('ht37TabProbe').style.display = tab === 'probe' ? 'block' : 'none';
          document.getElementById('ht37TabHex').style.display = tab === 'hex' ? 'block' : 'none';
          if (tab === 'probe') this.updateProbe();
        });
      });

      // Swap bytes toggle
      swapBtn.addEventListener('click', () => {
        this.swapBytesDefault = !this.swapBytesDefault;
        swapBtn.textContent = `🔄 Byte-Swap (5681 Fix): ${this.swapBytesDefault ? 'ON' : 'OFF'}`;
        swapBtn.style.background = this.swapBytesDefault ? '#8b5cf6' : '#374151';
        this.reRenderGallery();
        this.updateProbe();
      });

      // Probe controls
      const probeSlider = document.getElementById('ht37ProbeOffsetSlider');
      const probeWidth = document.getElementById('ht37ProbeWidth');
      const probeHeight = document.getElementById('ht37ProbeHeight');
      const probePreset = document.getElementById('ht37ProbePreset');
      const probeFormat = document.getElementById('ht37ProbeFormat');
      const probeChroma = document.getElementById('ht37ProbeChromaKey');

      probeSlider.addEventListener('input', () => this.updateProbe());
      probeWidth.addEventListener('input', () => this.updateProbe());
      probeHeight.addEventListener('input', () => this.updateProbe());
      probeFormat.addEventListener('change', () => this.updateProbe());
      probeChroma.addEventListener('change', () => this.updateProbe());

      probePreset.addEventListener('change', () => {
        if (probePreset.value !== 'custom') {
          const [w, h] = probePreset.value.split(',').map(Number);
          probeWidth.value = w;
          probeHeight.value = h;
          this.updateProbe();
        }
      });

      document.querySelectorAll('[data-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          const step = parseInt(btn.dataset.step, 10);
          probeSlider.value = Math.max(0, Math.min(this.fileSize, parseInt(probeSlider.value, 10) + step));
          this.updateProbe();
        });
      });

      document.getElementById('ht37BtnCaptureProbe').addEventListener('click', () => {
        this.captureCurrentProbe();
      });

      downloadAllBtn.addEventListener('click', () => {
        this.downloadAllSprites();
      });
    },

    loadFile(file) {
      this.fileName = file.name;
      this.fileSize = file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileData = new Uint8Array(e.target.result);
        this.processBinary();
      };
      reader.readAsArrayBuffer(file);
    },

    processBinary() {
      const buf = this.fileData;
      const size = this.fileSize;

      // Update Meta Bar
      document.getElementById('ht37MetaBar').style.display = 'flex';
      document.getElementById('ht37BadgeName').textContent = `File: ${this.fileName}`;
      document.getElementById('ht37BadgeSize').textContent = `Size: ${(size / 1024).toFixed(1)} KB (${size.toLocaleString()} B)`;

      const limitBadge = document.getElementById('ht37BadgeLimit');
      const maxDialBytes = 536400; // 0x00082F50 verified HT37 boundary
      if (size <= maxDialBytes) {
        limitBadge.className = 'ht37-badge success';
        limitBadge.textContent = `Dial Flash: OK (${((size / maxDialBytes) * 100).toFixed(0)}% of 524 KB)`;
      } else {
        limitBadge.className = 'ht37-badge warn';
        limitBadge.textContent = `Exceeds 524 KB limit!`;
      }

      // Detect container tag (TBUI or PUSH)
      let detectedFormat = 'Generic Smartwatch Binary';
      const asciiAll = this.bytesToAscii(buf.subarray(0, Math.min(1024, buf.length)));
      const asciiEnd = this.bytesToAscii(buf.subarray(Math.max(0, buf.length - 256)));

      if (asciiAll.includes('TBUI') || asciiEnd.includes('TBUI')) {
        detectedFormat = 'FitCloudPro TBUI Container';
      } else if (asciiAll.includes('PUSH') || asciiEnd.includes('PUSH')) {
        detectedFormat = 'Topstep PUSH Container';
      }
      document.getElementById('ht37BadgeFormat').textContent = `Format: ${detectedFormat}`;

      // Update probe slider range
      const slider = document.getElementById('ht37ProbeOffsetSlider');
      slider.max = size;
      slider.value = 0;

      // Generate Hex Dump for Tab 3
      this.renderHexDump();

      // Scan and extract all sprites
      this.scanForSprites();
    },

    bytesToAscii(bytes) {
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        str += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
      }
      return str;
    },

    scanForSprites() {
      this.sprites = [];
      const buf = this.fileData;

      // 1. Scan for Embedded PNGs (\x89PNG\r\n\x1a\n)
      for (let i = 0; i < buf.length - 8; i++) {
        if (buf[i] === 0x89 && buf[i+1] === 0x50 && buf[i+2] === 0x4E && buf[i+3] === 0x47 &&
            buf[i+4] === 0x0D && buf[i+5] === 0x0A && buf[i+6] === 0x1A && buf[i+7] === 0x0A) {
          const pngInfo = this.extractPngAtOffset(i);
          if (pngInfo) {
            this.sprites.push(pngInfo);
            i += pngInfo.length - 1; // jump forward
          }
        }
      }

      // 2. Scan for Embedded JPEGs (\xFF\xD8\xFF)
      for (let i = 0; i < buf.length - 3; i++) {
        if (buf[i] === 0xFF && buf[i+1] === 0xD8 && buf[i+2] === 0xFF) {
          const jpegInfo = this.extractJpegAtOffset(i);
          if (jpegInfo) {
            this.sprites.push(jpegInfo);
            i += jpegInfo.length - 1;
          }
        }
      }

      // 3. Scan for TBUI Structured Frame Tables
      this.scanTbuiFrameDescriptors();

      // 4. Check for Full-Screen 360x360 RGB565 Backgrounds (259,200 bytes)
      const fullScreenBytes = 360 * 360 * 2;
      const candidateOffsets = [0, 16, 32, 64, 128, 256, 512, 1024];
      for (const off of candidateOffsets) {
        if (off + fullScreenBytes <= buf.length) {
          // If no PNG was found covering this, register as candidate background
          const alreadyCovered = this.sprites.some(s => s.offset <= off && (s.offset + s.length) > off);
          if (!alreadyCovered) {
            this.sprites.unshift({
              type: 'RGB565',
              formatLabel: '360×360 Dial Background (Raw RGB565)',
              offset: off,
              length: fullScreenBytes,
              width: 360,
              height: 360,
              isBitmap: true
            });
            break;
          }
        }
      }

      // Render gallery
      this.reRenderGallery();
    },

    extractPngAtOffset(startOffset) {
      const buf = this.fileData;
      let ptr = startOffset + 8;
      let width = 0, height = 0;

      while (ptr + 8 <= buf.length) {
        const chunkLen = (buf[ptr] << 24) | (buf[ptr+1] << 16) | (buf[ptr+2] << 8) | buf[ptr+3];
        const chunkType = String.fromCharCode(buf[ptr+4], buf[ptr+5], buf[ptr+6], buf[ptr+7]);

        if (chunkType === 'IHDR' && ptr + 8 + 8 <= buf.length) {
          width = (buf[ptr+8] << 24) | (buf[ptr+9] << 16) | (buf[ptr+10] << 8) | buf[ptr+11];
          height = (buf[ptr+12] << 24) | (buf[ptr+13] << 16) | (buf[ptr+14] << 8) | buf[ptr+15];
        }

        ptr += 8 + chunkLen + 4; // type(4) + length(4) + data(chunkLen) + crc(4)

        if (chunkType === 'IEND') {
          const totalLen = ptr - startOffset;
          const slice = buf.subarray(startOffset, ptr);
          const blob = new Blob([slice], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          return {
            type: 'PNG',
            formatLabel: 'Embedded PNG',
            offset: startOffset,
            length: totalLen,
            width: width || 0,
            height: height || 0,
            dataUrl: url
          };
        }
      }
      return null;
    },

    extractJpegAtOffset(startOffset) {
      const buf = this.fileData;
      for (let i = startOffset + 2; i < buf.length - 1; i++) {
        if (buf[i] === 0xFF && buf[i+1] === 0xD9) {
          const totalLen = (i + 2) - startOffset;
          const slice = buf.subarray(startOffset, i + 2);
          const blob = new Blob([slice], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          return {
            type: 'JPEG',
            formatLabel: 'Embedded JPEG',
            offset: startOffset,
            length: totalLen,
            width: 0,
            height: 0,
            dataUrl: url
          };
        }
      }
      return null;
    },

    scanTbuiFrameDescriptors() {
      const buf = this.fileData;
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

      // Look for candidate 16-byte TBUI descriptor blocks:
      // [width: u16, height: u16, format: u16, flags: u16, dataOffset: u32, dataLength: u32]
      for (let i = 0; i < buf.length - 16; i += 4) {
        const w = view.getUint16(i, true);
        const h = view.getUint16(i + 2, true);
        const fmt = view.getUint16(i + 4, true);
        const off = view.getUint32(i + 8, true);
        const len = view.getUint32(i + 12, true);

        if (w >= 8 && w <= 360 && h >= 8 && h <= 360 && len >= (w * h) && len <= (w * h * 4)) {
          if (off > 0 && (off + len) <= buf.length) {
            // Check if already cataloged
            if (!this.sprites.some(s => s.offset === off)) {
              this.sprites.push({
                type: 'TBUI_FRAME',
                formatLabel: `TBUI Frame (Fmt ${fmt})`,
                offset: off,
                length: len,
                width: w,
                height: h,
                isBitmap: true
              });
            }
          }
        }
      }
    },

    reRenderGallery() {
      const grid = document.getElementById('ht37GalleryGrid');
      const countLabel = document.getElementById('ht37TabCount');
      const badgeSprites = document.getElementById('ht37BadgeSprites');
      const downloadAllBtn = document.getElementById('ht37BtnDownloadAll');

      grid.innerHTML = '';
      countLabel.textContent = this.sprites.length;
      badgeSprites.textContent = `Sprites: ${this.sprites.length}`;

      if (this.sprites.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
            No structured sprites identified yet.<br/>
            Switch to the <b>Interactive Raster Probe</b> tab to visually scrub and isolate sprites!
          </div>
        `;
        downloadAllBtn.style.display = 'none';
        return;
      }

      downloadAllBtn.style.display = 'inline-block';

      this.sprites.forEach((sprite, idx) => {
        const card = document.createElement('div');
        card.className = 'ht37-sprite-card';

        const canvasBox = document.createElement('div');
        canvasBox.className = 'ht37-canvas-container';

        const canvas = document.createElement('canvas');
        canvasBox.appendChild(canvas);

        const meta = document.createElement('div');
        meta.className = 'ht37-sprite-meta';
        meta.innerHTML = `
          <div style="color:#e2e8f0; font-weight:700;">#${idx + 1}: ${sprite.formatLabel}</div>
          <div>Size: ${sprite.width} × ${sprite.height} px</div>
          <div>Offset: 0x${sprite.offset.toString(16).toUpperCase().padStart(6, '0')} (${sprite.offset.toLocaleString()} B)</div>
          <div>Len: ${sprite.length.toLocaleString()} bytes</div>
        `;

        const btnRow = document.createElement('div');
        btnRow.className = 'ht37-btn-row';

        const dlBtn = document.createElement('button');
        dlBtn.className = 'ht37-action-btn';
        dlBtn.textContent = '💾 PNG';
        dlBtn.title = 'Download transparent PNG';
        dlBtn.addEventListener('click', () => {
          this.downloadCanvas(canvas, `ht37_sprite_${idx + 1}_${sprite.width}x${sprite.height}.png`);
        });

        const probeBtn = document.createElement('button');
        probeBtn.className = 'ht37-action-btn';
        probeBtn.textContent = '🔍 Probe';
        probeBtn.title = 'Inspect in Interactive Raster Probe';
        probeBtn.addEventListener('click', () => {
          this.loadIntoProbe(sprite);
        });

        btnRow.appendChild(dlBtn);
        btnRow.appendChild(probeBtn);

        card.appendChild(canvasBox);
        card.appendChild(meta);
        card.appendChild(btnRow);
        grid.appendChild(card);

        // Render graphics
        if (sprite.dataUrl) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.naturalWidth || sprite.width || 100;
            canvas.height = img.naturalHeight || sprite.height || 100;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
          };
          img.src = sprite.dataUrl;
        } else if (sprite.isBitmap) {
          canvas.width = sprite.width;
          canvas.height = sprite.height;
          const ctx = canvas.getContext('2d');
          this.decodeRgb565ToCanvas(ctx, sprite.offset, sprite.width, sprite.height, this.swapBytesDefault, true);
        }
      });
    },

    decodeRgb565ToCanvas(ctx, offset, width, height, swapBytes, chromaKey) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      const buf = this.fileData;
      let src = offset;
      let dst = 0;
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels; i++) {
        if (src + 1 >= buf.length) break;
        const b0 = buf[src];
        const b1 = buf[src + 1];
        src += 2;

        const raw = swapBytes ? ((b0 << 8) | b1) : ((b1 << 8) | b0);

        const r = Math.round(((raw >> 11) & 0x1F) * 255 / 31);
        const g = Math.round(((raw >> 5) & 0x3F) * 255 / 63);
        const b = Math.round((raw & 0x1F) * 255 / 31);

        const isTransparent = chromaKey && (raw === 0x0000);

        data[dst] = r;
        data[dst + 1] = g;
        data[dst + 2] = b;
        data[dst + 3] = isTransparent ? 0 : 255;
        dst += 4;
      }
      ctx.putImageData(imgData, 0, 0);
    },

    decodeArgb4444ToCanvas(ctx, offset, width, height) {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      const buf = this.fileData;
      let src = offset;
      let dst = 0;
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels; i++) {
        if (src + 1 >= buf.length) break;
        const b0 = buf[src];
        const b1 = buf[src + 1];
        src += 2;
        const raw = (b1 << 8) | b0;
        data[dst] = Math.round(((raw >> 8) & 0xF) * 255 / 15);
        data[dst + 1] = Math.round(((raw >> 4) & 0xF) * 255 / 15);
        data[dst + 2] = Math.round((raw & 0xF) * 255 / 15);
        data[dst + 3] = Math.round(((raw >> 12) & 0xF) * 255 / 15);
        dst += 4;
      }
      ctx.putImageData(imgData, 0, 0);
    },

    updateProbe() {
      if (!this.fileData) return;
      const canvas = document.getElementById('ht37ProbeCanvas');
      const ctx = canvas.getContext('2d');

      const width = parseInt(document.getElementById('ht37ProbeWidth').value, 10) || 360;
      const height = parseInt(document.getElementById('ht37ProbeHeight').value, 10) || 360;
      const offset = parseInt(document.getElementById('ht37ProbeOffsetSlider').value, 10) || 0;
      const format = document.getElementById('ht37ProbeFormat').value;
      const chroma = document.getElementById('ht37ProbeChromaKey').checked;

      canvas.width = width;
      canvas.height = height;
      document.getElementById('ht37ProbeOffsetLabel').textContent = `0x${offset.toString(16).toUpperCase().padStart(6, '0')} (${offset.toLocaleString()})`;

      if (format === 'rgb565_le') {
        this.decodeRgb565ToCanvas(ctx, offset, width, height, false, chroma);
      } else if (format === 'rgb565_be') {
        this.decodeRgb565ToCanvas(ctx, offset, width, height, true, chroma);
      } else if (format === 'argb4444') {
        this.decodeArgb4444ToCanvas(ctx, offset, width, height);
      } else {
        this.decodeRgb565ToCanvas(ctx, offset, width, height, false, chroma);
      }
    },

    loadIntoProbe(sprite) {
      document.querySelectorAll('.ht37-tab-btn').forEach(b => b.classList.remove('active'));
      const probeTabBtn = document.querySelector('[data-tab="probe"]');
      if (probeTabBtn) probeTabBtn.classList.add('active');

      document.getElementById('ht37TabGallery').style.display = 'none';
      document.getElementById('ht37TabProbe').style.display = 'block';
      document.getElementById('ht37TabHex').style.display = 'none';

      document.getElementById('ht37ProbeWidth').value = sprite.width;
      document.getElementById('ht37ProbeHeight').value = sprite.height;
      document.getElementById('ht37ProbeOffsetSlider').value = sprite.offset;
      document.getElementById('ht37ProbePreset').value = 'custom';

      this.updateProbe();
    },

    captureCurrentProbe() {
      const width = parseInt(document.getElementById('ht37ProbeWidth').value, 10) || 360;
      const height = parseInt(document.getElementById('ht37ProbeHeight').value, 10) || 360;
      const offset = parseInt(document.getElementById('ht37ProbeOffsetSlider').value, 10) || 0;
      const format = document.getElementById('ht37ProbeFormat').value;

      this.sprites.push({
        type: 'PROBED_SPRITE',
        formatLabel: `Probed Sprite (${format})`,
        offset: offset,
        length: width * height * 2,
        width: width,
        height: height,
        isBitmap: true
      });

      // Switch back to gallery
      document.querySelector('[data-tab="gallery"]').click();
      this.reRenderGallery();
    },

    downloadCanvas(canvas, filename) {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    downloadAllSprites() {
      const cards = document.querySelectorAll('.ht37-sprite-card canvas');
      cards.forEach((canvas, idx) => {
        setTimeout(() => {
          this.downloadCanvas(canvas, `ht37_sprite_${idx + 1}.png`);
        }, idx * 200);
      });
    },

    renderHexDump() {
      const out = document.getElementById('ht37HexOutput');
      const buf = this.fileData;
      let text = '=== HT37 WATCH FACE HEADER INSPECTION (First 256 bytes) ===\n';
      text += this.formatHexBlock(buf, 0, Math.min(256, buf.length));

      if (buf.length > 512) {
        text += '\n\n=== CONTAINER FOOTER / TRAILER (Last 256 bytes) ===\n';
        text += this.formatHexBlock(buf, Math.max(0, buf.length - 256), 256);
      }
      out.textContent = text;
    },

    formatHexBlock(buf, start, len) {
      let lines = [];
      const end = Math.min(start + len, buf.length);
      for (let i = start; i < end; i += 16) {
        let hex = '';
        let ascii = '';
        for (let j = 0; j < 16; j++) {
          if (i + j < end) {
            const b = buf[i + j];
            hex += b.toString(16).toUpperCase().padStart(2, '0') + ' ';
            ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
          } else {
            hex += '   ';
          }
        }
        lines.push(`0x${i.toString(16).toUpperCase().padStart(6, '0')} | ${hex}| ${ascii}`);
      }
      return lines.join('\n');
    }
  };

  // Attach globally
  window.HT37Decompiler = HT37Decompiler;

  // Initialize button listeners
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnOpenDecompiler');
    if (btn) {
      btn.addEventListener('click', () => HT37Decompiler.openModal());
    } else {
      // Auto-inject a toolbar launcher button if not present in markup
      const launcher = document.createElement('button');
      launcher.id = 'btnOpenDecompiler';
      launcher.innerHTML = '<span>🔬</span> Watch Face Decompiler (.bin / .pgl)';
      launcher.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999;
        background: #8b5cf6;
        color: #fff;
        border: none;
        padding: 10px 18px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      `;
      launcher.addEventListener('mouseenter', () => launcher.style.transform = 'scale(1.05)');
      launcher.addEventListener('mouseleave', () => launcher.style.transform = 'scale(1)');
      launcher.addEventListener('click', () => HT37Decompiler.openModal());
      document.body.appendChild(launcher);
    }
  });

})();
// Inject BMP scanner into HT37Decompiler
(function() {
  if (!window.HT37Decompiler) return;

  const originalScan = window.HT37Decompiler.scanForSprites;

  window.HT37Decompiler.scanForSprites = function() {
    // Run original scan (PNG, JPEG, TBUI)
    originalScan.call(this);

    const buf = this.fileData;
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

    // Scan for Embedded BMPs ('BM' = 0x42, 0x4D)
    for (let i = 0; i < buf.length - 26; i++) {
      if (buf[i] === 0x42 && buf[i+1] === 0x4D) {
        try {
          const fileSize = view.getUint32(i + 2, true);
          const reserved = view.getUint32(i + 6, true);
          const dataOffset = view.getUint32(i + 10, true);
          const dibSize = view.getUint32(i + 14, true);

          if (reserved === 0 && (dibSize === 40 || dibSize === 56 || dibSize === 108 || dibSize === 124)) {
            const width = Math.abs(view.getInt32(i + 18, true));
            const height = Math.abs(view.getInt32(i + 22, true));
            const bpp = view.getUint16(i + 28, true);

            if (width > 0 && width <= 480 && height > 0 && height <= 480 &&
                (bpp === 16 || bpp === 24 || bpp === 32 || bpp === 8) &&
                dataOffset < fileSize && (i + fileSize) <= buf.length) {
              
              // Verify not already added
              if (!this.sprites.some(s => s.offset === i)) {
                const slice = buf.subarray(i, i + fileSize);
                const blob = new Blob([slice], { type: 'image/bmp' });
                const url = URL.createObjectURL(blob);

                this.sprites.push({
                  type: 'BMP',
                  formatLabel: `Embedded BMP (${bpp}-bit)`,
                  offset: i,
                  length: fileSize,
                  width: width,
                  height: height,
                  dataUrl: url
                });

                i += fileSize - 1; // skip ahead
              }
            }
          }
        } catch(e) {}
      }
    }

    // Re-render gallery with detected BMPs
    this.reRenderGallery();
  };
})();