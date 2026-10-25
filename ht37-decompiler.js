/**
 * HT37 Dedicated BMP Watch Face Decompiler
 * Specializing in .bin / .pgl files using embedded BMP slices (DaFit / Topstep style)
 */
(function() {
  'use strict';

  // Inject UI Styles
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
      gap: 16px;
    }
    .ht37-dropzone {
      border: 2px dashed #0284c7;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      background: #0f172a;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ht37-dropzone:hover, .ht37-dropzone.dragover {
      border-color: #38bdf8;
      background: #1e293b;
    }
    .ht37-meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      background: #090d16;
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
    .ht37-action-btn {
      width: 100%;
      padding: 6px 12px;
      background: #0284c7;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 600;
      text-align: center;
    }
    .ht37-action-btn:hover { background: #0369a1; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const BMPDecompiler = {
    fileData: null,
    fileName: '',
    fileSize: 0,
    sprites: [],

    openModal() {
      let modal = document.getElementById('ht37BmpModal');
      if (!modal) {
        this.injectModal();
        modal = document.getElementById('ht37BmpModal');
      }
      modal.classList.remove('hidden');
    },

    closeModal() {
      const modal = document.getElementById('ht37BmpModal');
      if (modal) modal.classList.add('hidden');
    },

    injectModal() {
      const modalHtml = `
        <div id="ht37BmpModal" class="ht37-modal-overlay hidden">
          <div class="ht37-modal">
            <div class="ht37-modal-header">
              <div class="ht37-modal-title">
                <span>🖼️</span>
                <span>HT37 BMP Dial Asset Decompiler (.bin / .pgl)</span>
              </div>
              <button class="ht37-modal-close" id="ht37BmpCloseBtn">&times;</button>
            </div>
            <div class="ht37-modal-body">
              <div class="ht37-dropzone" id="ht37BmpDropzone">
                <p style="margin:0 0 8px 0; font-size:1.05rem; font-weight:600; color:#e2e8f0;">
                  Drag & Drop .bin or .pgl Watch Face File Here
                </p>
                <p style="margin:0; font-size:0.85rem; color:#94a3b8;">
                  or click to select your downloaded dial file
                </p>
                <input type="file" id="ht37BmpFileInput" accept=".bin,.pgl,*" style="display:none;" />
              </div>

              <div class="ht37-meta-bar" id="ht37BmpMetaBar" style="display:none;">
                <span class="ht37-badge" id="ht37BmpName">File: None</span>
                <span class="ht37-badge" id="ht37BmpSize">Size: 0 B</span>
                <span class="ht37-badge success" id="ht37BmpCount">BMP Sprites Found: 0</span>
              </div>

              <div class="ht37-gallery-grid" id="ht37BmpGalleryGrid">
                <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
                  Load a .bin or .pgl file above to extract embedded BMP sprites.
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
      const modal = document.getElementById('ht37BmpModal');
      const closeBtn = document.getElementById('ht37BmpCloseBtn');
      const dropzone = document.getElementById('ht37BmpDropzone');
      const fileInput = document.getElementById('ht37BmpFileInput');

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
    },

    loadFile(file) {
      this.fileName = file.name;
      this.fileSize = file.size;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileData = new Uint8Array(e.target.result);
        this.scanForBmpSprites();
      };
      reader.readAsArrayBuffer(file);
    },

    scanForBmpSprites() {
      const buf = this.fileData;
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      this.sprites = [];

      document.getElementById('ht37BmpMetaBar').style.display = 'flex';
      document.getElementById('ht37BmpName').textContent = `File: ${this.fileName}`;
      document.getElementById('ht37BmpSize').textContent = `Size: ${(this.fileSize / 1024).toFixed(1)} KB`;

      // Scan for Windows BMP magic signature: 'B' (0x42), 'M' (0x4D)
      for (let i = 0; i < buf.length - 26; i++) {
        if (buf[i] === 0x42 && buf[i+1] === 0x4D) {
          try {
            const fileSize = view.getUint32(i + 2, true);
            const reserved = view.getUint32(i + 6, true);
            const dataOffset = view.getUint32(i + 10, true);
            const dibSize = view.getUint32(i + 14, true);

            // Standard DIB header sizes: 40 (BITMAPINFOHEADER), 56, 108, 124
            if (reserved === 0 && (dibSize === 40 || dibSize === 56 || dibSize === 108 || dibSize === 124)) {
              const width = Math.abs(view.getInt32(i + 18, true));
              const height = Math.abs(view.getInt32(i + 22, true));
              const bpp = view.getUint16(i + 28, true);

              if (width > 0 && width <= 1000 && height > 0 && height <= 1000 &&
                  (bpp === 16 || bpp === 24 || bpp === 32 || bpp === 8 || bpp === 4 || bpp === 1) &&
                  dataOffset < fileSize && (i + fileSize) <= buf.length) {

                const slice = buf.subarray(i, i + fileSize);
                const blob = new Blob([slice], { type: 'image/bmp' });
                const url = URL.createObjectURL(blob);

                this.sprites.push({
                  offset: i,
                  length: fileSize,
                  width: width,
                  height: height,
                  bpp: bpp,
                  url: url
                });

                i += fileSize - 1; // advance pointer past this BMP
              }
            }
          } catch(e) {}
        }
      }

      document.getElementById('ht37BmpCount').textContent = `BMP Sprites Found: ${this.sprites.length}`;
      this.renderGallery();
    },

    renderGallery() {
      const grid = document.getElementById('ht37BmpGalleryGrid');
      grid.innerHTML = '';

      if (this.sprites.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#ef4444;">
            No standard 'BM' headers found in this file.<br/>
            The sprites may be raw uncompressed DIB bitmaps without the 14-byte file header.
          </div>
        `;
        return;
      }

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
          <div style="color:#e2e8f0; font-weight:700;">#${idx + 1}: ${sprite.width === 360 && sprite.height === 360 ? 'Full Dial Background' : 'Sprite Slice'}</div>
          <div>Dimensions: ${sprite.width} × ${sprite.height} px</div>
          <div>Color Depth: ${sprite.bpp}-bit BMP</div>
          <div>Offset: 0x${sprite.offset.toString(16).toUpperCase().padStart(6, '0')} (${sprite.offset.toLocaleString()} B)</div>
          <div>Size: ${sprite.length.toLocaleString()} bytes</div>
        `;

        const dlBtn = document.createElement('button');
        dlBtn.className = 'ht37-action-btn';
        dlBtn.textContent = '💾 Download PNG';
        dlBtn.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `ht37_bmp_${idx + 1}_${sprite.width}x${sprite.height}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        card.appendChild(canvasBox);
        card.appendChild(meta);
        card.appendChild(dlBtn);
        grid.appendChild(card);

        // Draw image onto canvas
        const img = new Image();
        img.onload = () => {
          canvas.width = img.naturalWidth || sprite.width;
          canvas.height = img.naturalHeight || sprite.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
        };
        img.src = sprite.url;
      });
    }
  };

  window.BMPDecompiler = BMPDecompiler;

  // Wire up launcher button
  document.addEventListener('DOMContentLoaded', () => {
    const launcher = document.createElement('button');
    launcher.id = 'btnOpenBmpDecompiler';
    launcher.innerHTML = '<span>🖼️</span> BMP Dial Decompiler';
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
    launcher.addEventListener('click', () => BMPDecompiler.openModal());
    document.body.appendChild(launcher);
  });

})();