/**
 * HT37 Universal Watch Face Decompiler (.bin & .pgl)
 * Supports ZIP/GZIP packages, embedded PNG/JPEG carving, TBUI frame tables,
 * and solid-pixel rendering with full clipboard diagnostics.
 */
(function() {
  'use strict';

  // Inject CSS with explicit user-selection enabled
  const styles = `
    .ht37-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 29, 0.90);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .ht37-modal-overlay.hidden { display: none !important; }
    .ht37-modal {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 12px;
      width: 100%;
      max-width: 1150px;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: text !important;
      -webkit-user-select: text !important;
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
      color: #38bdf8;
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
      gap: 14px;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .ht37-dropzone {
      border: 2px dashed #0284c7;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      background: #0f172a;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ht37-dropzone:hover, .ht37-dropzone.dragover {
      border-color: #38bdf8;
      background: #1e293b;
    }
    .ht37-diag-bar {
      background: #090d16;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      font-size: 0.82rem;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      gap: 8px;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .ht37-meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .ht37-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      background: #1f2937;
      color: #cbd5e1;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .ht37-pill.info { background: #0369a1; color: #e0f2fe; }
    .ht37-pill.success { background: #064e3b; color: #6ee7b7; }
    .ht37-pill.warn { background: #7f1d1d; color: #fca5a5; }
    .ht37-btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .ht37-btn-purple { background: #8b5cf6; color: #fff; }
    .ht37-btn-purple:hover { background: #7c3aed; }
    .ht37-btn-blue { background: #0284c7; color: #fff; }
    .ht37-btn-blue:hover { background: #0369a1; }
    .ht37-btn-copy { background: #374151; color: #e5e7eb; border: 1px solid #4b5563; }
    .ht37-btn-copy:hover { background: #4b5563; color: #fff; }
    .ht37-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      max-height: 520px;
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
      user-select: text !important;
      -webkit-user-select: text !important;
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
      font-size: 0.72rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: monospace;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    .ht37-mode-select {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      color: #38bdf8;
      font-size: 0.72rem;
      padding: 4px;
      border-radius: 4px;
      font-family: monospace;
    }
    .ht37-hex-box {
      background: #000;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #1e293b;
      color: #38bdf8;
      font-size: 0.72rem;
      white-space: pre-wrap;
      word-break: break-all;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const UniversalDecompiler = {
    fileData: null,
    fileName: '',
    fileSize: 0,
    sprites: [],
    globalSwap: true,
    chromaKeyBlack: false, // Default to FALSE so black pixels are SOLID and visible!
    lastDiagnosticText: '',

    openModal() {
      let modal = document.getElementById('ht37UniversalModal');
      if (!modal) {
        this.injectModal();
        modal = document.getElementById('ht37UniversalModal');
      }
      modal.classList.remove('hidden');
    },

    closeModal() {
      const modal = document.getElementById('ht37UniversalModal');
      if (modal) modal.classList.add('hidden');
    },

    injectModal() {
      const modalHtml = `
        <div id="ht37UniversalModal" class="ht37-modal-overlay hidden">
          <div class="ht37-modal">
            <div class="ht37-modal-header">
              <div class="ht37-modal-title">
                <span>📦</span>
                <span>HT37 Watch Face Decompiler (.bin / .pgl)</span>
              </div>
              <button class="ht37-modal-close" id="ht37UniCloseBtn">&times;</button>
            </div>
            <div class="ht37-modal-body">
              <div class="ht37-dropzone" id="ht37UniDropzone">
                <p style="margin:0 0 6px 0; font-size:1.05rem; font-weight:600; color:#e2e8f0;">
                  Drag & Drop .bin or .pgl Watch Face File Here
                </p>
                <p style="margin:0; font-size:0.85rem; color:#94a3b8;">
                  Auto-detects ZIP packages, TBUI containers, Bluetrum AB5681G frames & PNG streams
                </p>
                <input type="file" id="ht37UniFileInput" accept=".bin,.pgl,*" style="display:none;" />
              </div>

              <div class="ht37-diag-bar" id="ht37UniDiagBar" style="display:none;">
                <div class="ht37-meta-pills">
                  <span class="ht37-pill info" id="ht37UniName">File: None</span>
                  <span class="ht37-pill" id="ht37UniSize">Size: 0 B</span>
                  <span class="ht37-pill success" id="ht37UniTag">Type: Detecting...</span>
                  <span class="ht37-pill success" id="ht37UniCount">Sprites: 0</span>

                  <button class="ht37-btn ht37-btn-copy" id="ht37BtnCopyDiag" style="margin-left:auto;">
                    📋 Copy Diagnostic to Clipboard
                  </button>

                  <button class="ht37-btn ht37-btn-purple" id="ht37BtnToggleSwap">
                    🔄 5681 Byte-Swap: ON
                  </button>

                  <button class="ht37-btn" id="ht37BtnToggleChroma" style="background:#374151; color:#cbd5e1;">
                    ⬛ Black Pixels: SOLID
                  </button>

                  <button class="ht37-btn ht37-btn-blue" id="ht37BtnDownloadAll" style="display:none;">
                    💾 Download All PNGs
                  </button>
                </div>

                <div class="ht37-hex-box" id="ht37UniHexDump">Awaiting file...</div>
              </div>

              <div class="ht37-gallery-grid" id="ht37UniGalleryGrid">
                <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
                  Select or drop a .bin or .pgl file above.
                </div>
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
      const modal = document.getElementById('ht37UniversalModal');
      const closeBtn = document.getElementById('ht37UniCloseBtn');
      const dropzone = document.getElementById('ht37UniDropzone');
      const fileInput = document.getElementById('ht37UniFileInput');
      const copyDiagBtn = document.getElementById('ht37BtnCopyDiag');
      const toggleSwapBtn = document.getElementById('ht37BtnToggleSwap');
      const toggleChromaBtn = document.getElementById('ht37BtnToggleChroma');
      const downloadAllBtn = document.getElementById('ht37BtnDownloadAll');

      closeBtn.addEventListener('click', () => this.closeModal());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });

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

      // 1-Click Clipboard Copy
      copyDiagBtn.addEventListener('click', () => {
        if (this.lastDiagnosticText) {
          navigator.clipboard.writeText(this.lastDiagnosticText).then(() => {
            copyDiagBtn.textContent = '✅ Copied to Clipboard!';
            setTimeout(() => {
              copyDiagBtn.textContent = '📋 Copy Diagnostic to Clipboard';
            }, 2000);
          }).catch(() => {
            // Fallback for older browsers
            prompt('Copy diagnostic data manually:', this.lastDiagnosticText);
          });
        }
      });

      toggleSwapBtn.addEventListener('click', () => {
        this.globalSwap = !this.globalSwap;
        toggleSwapBtn.textContent = `🔄 5681 Byte-Swap: ${this.globalSwap ? 'ON' : 'OFF'}`;
        toggleSwapBtn.style.background = this.globalSwap ? '#8b5cf6' : '#374151';
        this.reRenderAllSprites();
      });

      toggleChromaBtn.addEventListener('click', () => {
        this.chromaKeyBlack = !this.chromaKeyBlack;
        toggleChromaBtn.textContent = `⬛ Black Pixels: ${this.chromaKeyBlack ? 'TRANSPARENT' : 'SOLID'}`;
        toggleChromaBtn.style.background = this.chromaKeyBlack ? '#b45309' : '#374151';
        this.reRenderAllSprites();
      });

      downloadAllBtn.addEventListener('click', () => {
        const canvases = document.querySelectorAll('.ht37-sprite-card canvas');
        canvases.forEach((c, idx) => {
          setTimeout(() => {
            const a = document.createElement('a');
            a.href = c.toDataURL('image/png');
            a.download = `ht37_sprite_${idx + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, idx * 150);
        });
      });
    },

    loadFile(file) {
      this.fileName = file.name;
      this.fileSize = file.size;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          this.fileData = new Uint8Array(e.target.result);
          await this.processFile();
        } catch (err) {
          this.showErrorDiagnostic(err);
        }
      };
      reader.onerror = (err) => {
        this.showErrorDiagnostic(err);
      };
      reader.readAsArrayBuffer(file);
    },

    async processFile() {
      let buf = this.fileData;
      this.sprites = [];

      document.getElementById('ht37UniDiagBar').style.display = 'flex';
      document.getElementById('ht37UniName').textContent = `File: ${this.fileName}`;
      document.getElementById('ht37UniSize').textContent = `Size: ${(this.fileSize / 1024).toFixed(1)} KB (${this.fileSize.toLocaleString()} B)`;

      // Build diagnostic hex string for first 48 bytes and last 32 bytes
      let diag = `=== HT37 FILE DIAGNOSTIC ===\nFile: ${this.fileName} (${this.fileSize} bytes)\n`;
      diag += `Header (0x00 - 0x2F):\n` + this.formatHexBlock(buf, 0, Math.min(48, buf.length));

      if (buf.length > 64) {
        diag += `\nFooter (Last 32 bytes):\n` + this.formatHexBlock(buf, Math.max(0, buf.length - 32), 32);
      }

      // 1. Check if file is a ZIP Package (PK\x03\x04 = 0x50 0x4B 0x03 0x04)
      if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) {
        document.getElementById('ht37UniTag').textContent = 'ZIP Archive Package';
        diag += `\nContainer: Detected standard ZIP Archive. Unpacking internal files...`;
        await this.unpackZipEntries(buf);
      }
      // 2. Check if GZIP (0x1F 0x8B)
      else if (buf[0] === 0x1F && buf[1] === 0x8B) {
        document.getElementById('ht37UniTag').textContent = 'GZIP Compressed Stream';
        diag += `\nContainer: Detected GZIP stream. Decompressing...`;
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('gzip');
          const stream = new Blob([buf]).stream().pipeThrough(ds);
          const decompressedBuf = await new Response(stream).arrayBuffer();
          buf = new Uint8Array(decompressedBuf);
          this.fileData = buf;
          this.scanUniversalAssets(buf);
        }
      }
      // 3. Regular Binary (.bin or raw .pgl)
      else {
        let tag = 'Raw Binary Dial';
        const strStart = this.bytesToAscii(buf.subarray(0, Math.min(512, buf.length)));
        const strEnd = this.bytesToAscii(buf.subarray(Math.max(0, buf.length - 256)));

        if (strStart.includes('TBUI') || strEnd.includes('TBUI')) {
          tag = 'TBUI Container';
        } else if (strStart.includes('PUSH') || strEnd.includes('PUSH')) {
          tag = 'PUSH Container';
        }
        document.getElementById('ht37UniTag').textContent = tag;
        diag += `\nIdentified Format: ${tag}`;
        this.scanUniversalAssets(buf);
      }

      diag += `\nExtracted Sprites Total: ${this.sprites.length}`;
      this.lastDiagnosticText = diag;
      document.getElementById('ht37UniHexDump').textContent = diag;
      document.getElementById('ht37UniCount').textContent = `Sprites: ${this.sprites.length}`;
      document.getElementById('ht37BtnDownloadAll').style.display = this.sprites.length ? 'inline-block' : 'none';

      this.renderGallery();
    },

    scanUniversalAssets(buf) {
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

      // A. Scan for Embedded PNGs (\x89PNG\r\n\x1a\n)
      for (let i = 0; i < buf.length - 8; i++) {
        if (buf[i] === 0x89 && buf[i+1] === 0x50 && buf[i+2] === 0x4E && buf[i+3] === 0x47 &&
            buf[i+4] === 0x0D && buf[i+5] === 0x0A && buf[i+6] === 0x1A && buf[i+7] === 0x0A) {
          const png = this.carvePng(buf, i);
          if (png) {
            this.sprites.push(png);
            i += png.length - 1;
          }
        }
      }

      // B. Scan for Embedded JPEGs (\xFF\xD8\xFF)
      for (let i = 0; i < buf.length - 3; i++) {
        if (buf[i] === 0xFF && buf[i+1] === 0xD8 && buf[i+2] === 0xFF) {
          const jpeg = this.carveJpeg(buf, i);
          if (jpeg) {
            this.sprites.push(jpeg);
            i += jpeg.length - 1;
          }
        }
      }

      // C. Scan for Structured TBUI Frame Descriptors (stride 4)
      for (let i = 0; i < buf.length - 16; i += 4) {
        const w = view.getUint16(i, true);
        const h = view.getUint16(i + 2, true);
        const fmt = view.getUint16(i + 4, true);
        const off = view.getUint32(i + 8, true);
        const len = view.getUint32(i + 12, true);

        // Frame dimension bounds: width & height <= 360, length valid
        if (w >= 6 && w <= 360 && h >= 6 && h <= 360 && len >= (w * h) && len <= (w * h * 4)) {
          if (off >= 16 && (off + len) <= buf.length) {
            if (!this.sprites.some(s => s.offset === off)) {
              this.sprites.push({
                index: this.sprites.length + 1,
                label: `Frame ${w}×${h}`,
                type: 'TBUI_FRAME',
                width: w,
                height: h,
                offset: off,
                length: len,
                format: fmt,
                isRaw: true
              });
            }
          }
        }
      }

      // D. Full Dial 360x360 Background check (259,200 bytes)
      const fullScreenBytes = 360 * 360 * 2;
      const offsets = [0, 16, 32, 64, 128, 256, 512, 1024];
      for (const off of offsets) {
        if (off + fullScreenBytes <= buf.length) {
          if (!this.sprites.some(s => s.offset === off && s.width === 360)) {
            this.sprites.unshift({
              index: 0,
              label: '360×360 Background Layer',
              type: 'RAW_BG',
              width: 360,
              height: 360,
              offset: off,
              length: fullScreenBytes,
              isRaw: true
            });
            break;
          }
        }
      }

      // Re-index sprites
      this.sprites.forEach((s, idx) => s.index = idx + 1);
    },

    async unpackZipEntries(buf) {
      let ptr = 0;
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

      while (ptr < buf.length - 30) {
        // Look for local file header: 0x04034B50
        if (buf[ptr] === 0x50 && buf[ptr+1] === 0x4B && buf[ptr+2] === 0x03 && buf[ptr+3] === 0x04) {
          const compMethod = view.getUint16(ptr + 8, true);
          const compSize = view.getUint32(ptr + 18, true);
          const uncompSize = view.getUint32(ptr + 22, true);
          const fnameLen = view.getUint16(ptr + 26, true);
          const extraLen = view.getUint16(ptr + 28, true);

          const fnameBytes = buf.subarray(ptr + 30, ptr + 30 + fnameLen);
          const fileName = new TextDecoder().decode(fnameBytes);
          const dataStart = ptr + 30 + fnameLen + extraLen;
          const compData = buf.subarray(dataStart, dataStart + compSize);

          let fileBytes = null;
          if (compMethod === 0) { // Stored (Uncompressed)
            fileBytes = compData;
          } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') { // Deflate
            try {
              const ds = new DecompressionStream('deflate-raw');
              const stream = new Blob([compData]).stream().pipeThrough(ds);
              const uncompressed = await new Response(stream).arrayBuffer();
              fileBytes = new Uint8Array(uncompressed);
            } catch(e) {}
          }

          if (fileBytes && fileBytes.length > 0) {
            // Check if PNG / JPEG image
            if (fileName.match(/\.(png|jpg|jpeg|bmp)$/i) || (fileBytes[0] === 0x89 && fileBytes[1] === 0x50)) {
              const blob = new Blob([fileBytes], { type: 'image/png' });
              this.sprites.push({
                index: this.sprites.length + 1,
                label: fileName,
                type: 'ZIP_IMAGE',
                width: 0,
                height: 0,
                offset: dataStart,
                length: fileBytes.length,
                url: URL.createObjectURL(blob)
              });
            } else if (fileName.match(/\.bin$/i)) {
              // Internal dial.bin
              this.scanUniversalAssets(fileBytes);
            }
          }

          ptr = dataStart + compSize;
        } else {
          ptr++;
        }
      }
    },

    carvePng(buf, offset) {
      let ptr = offset + 8;
      let width = 0, height = 0;

      while (ptr + 8 <= buf.length) {
        const len = (buf[ptr] << 24) | (buf[ptr+1] << 16) | (buf[ptr+2] << 8) | buf[ptr+3];
        const type = String.fromCharCode(buf[ptr+4], buf[ptr+5], buf[ptr+6], buf[ptr+7]);

        if (type === 'IHDR' && ptr + 16 <= buf.length) {
          width = (buf[ptr+8] << 24) | (buf[ptr+9] << 16) | (buf[ptr+10] << 8) | buf[ptr+11];
          height = (buf[ptr+12] << 24) | (buf[ptr+13] << 16) | (buf[ptr+14] << 8) | buf[ptr+15];
        }

        ptr += 8 + len + 4; // type(4) + len(4) + data(len) + crc(4)

        if (type === 'IEND') {
          const slice = buf.subarray(offset, ptr);
          return {
            index: 0,
            label: `Embedded PNG (${width}×${height})`,
            type: 'PNG',
            width: width,
            height: height,
            offset: offset,
            length: ptr - offset,
            url: URL.createObjectURL(new Blob([slice], { type: 'image/png' }))
          };
        }
      }
      return null;
    },

    carveJpeg(buf, offset) {
      for (let i = offset + 2; i < buf.length - 1; i++) {
        if (buf[i] === 0xFF && buf[i+1] === 0xD9) {
          const total = (i + 2) - offset;
          const slice = buf.subarray(offset, i + 2);
          return {
            index: 0,
            label: `Embedded JPEG`,
            type: 'JPEG',
            width: 0,
            height: 0,
            offset: offset,
            length: total,
            url: URL.createObjectURL(new Blob([slice], { type: 'image/jpeg' }))
          };
        }
      }
      return null;
    },

    renderGallery() {
      const grid = document.getElementById('ht37UniGalleryGrid');
      grid.innerHTML = '';

      if (this.sprites.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#ef4444;">
            No sprites recognized. Click <b>"📋 Copy Diagnostic to Clipboard"</b> above and share the readout.
          </div>
        `;
        return;
      }

      this.sprites.forEach(sprite => {
        const card = document.createElement('div');
        card.className = 'ht37-sprite-card';

        const canvasBox = document.createElement('div');
        canvasBox.className = 'ht37-canvas-container';

        const canvas = document.createElement('canvas');
        canvas.id = `ht37Canvas_${sprite.index}`;
        canvasBox.appendChild(canvas);

        const meta = document.createElement('div');
        meta.className = 'ht37-sprite-meta';
        meta.innerHTML = `
          <div style="color:#e2e8f0; font-weight:700;">#${sprite.index}: ${sprite.label}</div>
          <div>Size: ${sprite.width} × ${sprite.height} px</div>
          <div>Offset: 0x${sprite.offset.toString(16).toUpperCase().padStart(6, '0')} (${sprite.offset.toLocaleString()} B)</div>
          <div>Length: ${sprite.length.toLocaleString()} bytes</div>
        `;

        const select = document.createElement('select');
        select.className = 'ht37-mode-select';
        select.innerHTML = `
          <option value="rgb565_swap">RGB565 (5681 Byte-Swapped)</option>
          <option value="rgb565_le">RGB565 (ARM Standard LE)</option>
          <option value="solid_gray">High-Contrast Silhouette</option>
        `;
        select.value = this.globalSwap ? 'rgb565_swap' : 'rgb565_le';
        select.addEventListener('change', () => {
          this.drawRawSprite(canvas, sprite, select.value);
        });

        const dlBtn = document.createElement('button');
        dlBtn.className = 'ht37-btn ht37-btn-blue';
        dlBtn.style.cssText = 'width:100%; font-size:0.75rem; justify-content:center;';
        dlBtn.textContent = '💾 Download PNG';
        dlBtn.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `ht37_sprite_${sprite.index}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        card.appendChild(canvasBox);
        card.appendChild(meta);
        if (sprite.isRaw) card.appendChild(select);
        card.appendChild(dlBtn);
        grid.appendChild(card);

        // Render Image
        if (sprite.url) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.naturalWidth || sprite.width || 100;
            canvas.height = img.naturalHeight || sprite.height || 100;
            meta.children[1].textContent = `Size: ${canvas.width} × ${canvas.height} px`;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
          };
          img.src = sprite.url;
        } else if (sprite.isRaw) {
          this.drawRawSprite(canvas, sprite, select.value);
        }
      });
    },

    reRenderAllSprites() {
      this.sprites.forEach(sprite => {
        if (sprite.isRaw) {
          const canvas = document.getElementById(`ht37Canvas_${sprite.index}`);
          if (canvas) {
            const mode = this.globalSwap ? 'rgb565_swap' : 'rgb565_le';
            this.drawRawSprite(canvas, sprite, mode);
          }
        }
      });
    },

    drawRawSprite(canvas, sprite, mode) {
      canvas.width = sprite.width;
      canvas.height = sprite.height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(sprite.width, sprite.height);
      const data = imgData.data;
      const buf = this.fileData;
      const totalPixels = sprite.width * sprite.height;
      const swap = (mode === 'rgb565_swap');
      let src = sprite.offset;
      let dst = 0;

      for (let i = 0; i < totalPixels; i++) {
        if (src + 1 >= buf.length || src >= (sprite.offset + sprite.length)) break;
        const b0 = buf[src];
        const b1 = buf[src + 1];
        src += 2;

        const raw = swap ? ((b0 << 8) | b1) : ((b1 << 8) | b0);

        if (mode === 'solid_gray') {
          const lum = raw > 0 ? 255 : 0;
          data[dst] = lum;
          data[dst + 1] = lum;
          data[dst + 2] = lum;
          data[dst + 3] = 255;
        } else {
          const r = Math.round(((raw >> 11) & 0x1F) * 255 / 31);
          const g = Math.round(((raw >> 5) & 0x3F) * 255 / 63);
          const b = Math.round((raw & 0x1F) * 255 / 31);

          // If chromaKeyBlack is false, black is SOLID (alpha=255)! No invisible squares!
          const isTransparent = this.chromaKeyBlack && (raw === 0x0000);

          data[dst] = r;
          data[dst + 1] = g;
          data[dst + 2] = b;
          data[dst + 3] = isTransparent ? 0 : 255;
        }
        dst += 4;
      }
      ctx.putImageData(imgData, 0, 0);
    },

    showErrorDiagnostic(err) {
      document.getElementById('ht37UniDiagBar').style.display = 'flex';
      document.getElementById('ht37UniTag').textContent = 'Error Parsing File';
      document.getElementById('ht37UniTag').className = 'ht37-pill warn';

      let text = `ERROR INGESTING FILE: ${this.fileName}\n`;
      text += `Message: ${err.message || err}\n`;
      text += `Stack: ${err.stack || 'None'}\n\n`;

      if (this.fileData) {
        text += `Header (First 32 bytes):\n` + this.formatHexBlock(this.fileData, 0, Math.min(32, this.fileData.length));
      }

      this.lastDiagnosticText = text;
      document.getElementById('ht37UniHexDump').textContent = text;
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
    },

    bytesToAscii(bytes) {
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        str += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
      }
      return str;
    }
  };

  window.UniversalDecompiler = UniversalDecompiler;

  // Mount Floating Button
  document.addEventListener('DOMContentLoaded', () => {
    const launcher = document.createElement('button');
    launcher.id = 'btnOpenUniversalDecompiler';
    launcher.innerHTML = '<span>📦</span> Watch Face Decompiler (.bin / .pgl)';
    launcher.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999;
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.2s ease;
    `;
    launcher.addEventListener('mouseenter', () => launcher.style.transform = 'scale(1.05)');
    launcher.addEventListener('mouseleave', () => launcher.style.transform = 'scale(1)');
    launcher.addEventListener('click', () => UniversalDecompiler.openModal());
    document.body.appendChild(launcher);
  });

})();