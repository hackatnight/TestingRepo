/**
 * HT37 TBUI & Bluetrum AB5681G Watch Face Decompiler
 * Parses TBUI container tables, extracts individual sprite frames,
 * and decodes 5681 byte-swapped RGB565 / RLE graphics.
 */
(function() {
  'use strict';

  // Inject UI Styles
  const styles = `
    .ht37-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 15, 29, 0.88);
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
      max-width: 1150px;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
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
      gap: 14px;
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
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      font-size: 0.8rem;
      font-family: monospace;
      display: flex;
      flex-direction: column;
      gap: 6px;
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
      padding: 3px 8px;
      border-radius: 6px;
      background: #1f2937;
      color: #cbd5e1;
    }
    .ht37-pill.info { background: #0369a1; color: #e0f2fe; }
    .ht37-pill.success { background: #064e3b; color: #6ee7b7; }
    .ht37-pill.warn { background: #78350f; color: #fde68a; }
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
    .ht37-action-btn {
      width: 100%;
      padding: 5px 10px;
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

  const TBUIDecompiler = {
    fileData: null,
    fileName: '',
    fileSize: 0,
    sprites: [],
    globalSwap: true, // Default to 5681 byte swap

    openModal() {
      let modal = document.getElementById('ht37TbuiModal');
      if (!modal) {
        this.injectModal();
        modal = document.getElementById('ht37TbuiModal');
      }
      modal.classList.remove('hidden');
    },

    closeModal() {
      const modal = document.getElementById('ht37TbuiModal');
      if (modal) modal.classList.add('hidden');
    },

    injectModal() {
      const modalHtml = `
        <div id="ht37TbuiModal" class="ht37-modal-overlay hidden">
          <div class="ht37-modal">
            <div class="ht37-modal-header">
              <div class="ht37-modal-title">
                <span>⚡</span>
                <span>HT37 TBUI & Bluetrum 5681 Sprite Decompiler</span>
              </div>
              <button class="ht37-modal-close" id="ht37TbuiCloseBtn">&times;</button>
            </div>
            <div class="ht37-modal-body">
              <div class="ht37-dropzone" id="ht37TbuiDropzone">
                <p style="margin:0 0 6px 0; font-size:1.05rem; font-weight:600; color:#e2e8f0;">
                  Drag & Drop .bin or .pgl Watch Face File Here
                </p>
                <p style="margin:0; font-size:0.85rem; color:#94a3b8;">
                  Supports TBUI container, Bluetrum AB5681G sprite streams & PUSH dials
                </p>
                <input type="file" id="ht37TbuiFileInput" accept=".bin,.pgl,*" style="display:none;" />
              </div>

              <div class="ht37-diag-bar" id="ht37TbuiDiagBar" style="display:none;">
                <div class="ht37-meta-pills">
                  <span class="ht37-pill info" id="ht37TbuiName">File: None</span>
                  <span class="ht37-pill" id="ht37TbuiSize">Size: 0 B</span>
                  <span class="ht37-pill success" id="ht37TbuiTag">Tag: Searching...</span>
                  <span class="ht37-pill success" id="ht37TbuiCount">Sprites: 0</span>
                  <button class="ht37-pill" id="ht37BtnToggleAllSwap" style="margin-left:auto; cursor:pointer; background:#8b5cf6; color:#fff; border:none;">
                    🔄 5681 Byte-Swap: ON
                  </button>
                  <button class="ht37-pill" id="ht37BtnDownloadAll" style="cursor:pointer; background:#0284c7; color:#fff; border:none; display:none;">
                    💾 Download All PNGs
                  </button>
                </div>
                <div id="ht37TbuiHexDump" style="color:#94a3b8; font-size:0.7rem; white-space:pre-wrap; word-break:break-all;"></div>
              </div>

              <div class="ht37-gallery-grid" id="ht37TbuiGalleryGrid">
                <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
                  Load a .bin or .pgl watch face file to decompile all internal sprites.
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
      const modal = document.getElementById('ht37TbuiModal');
      const closeBtn = document.getElementById('ht37TbuiCloseBtn');
      const dropzone = document.getElementById('ht37TbuiDropzone');
      const fileInput = document.getElementById('ht37TbuiFileInput');
      const toggleSwapBtn = document.getElementById('ht37BtnToggleAllSwap');
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

      toggleSwapBtn.addEventListener('click', () => {
        this.globalSwap = !this.globalSwap;
        toggleSwapBtn.textContent = `🔄 5681 Byte-Swap: ${this.globalSwap ? 'ON' : 'OFF'}`;
        toggleSwapBtn.style.background = this.globalSwap ? '#8b5cf6' : '#374151';
        this.reRenderAllCanvases();
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
      reader.onload = (e) => {
        this.fileData = new Uint8Array(e.target.result);
        this.processTbuiDial();
      };
      reader.readAsArrayBuffer(file);
    },

    processTbuiDial() {
      const buf = this.fileData;
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      this.sprites = [];

      document.getElementById('ht37TbuiDiagBar').style.display = 'flex';
      document.getElementById('ht37TbuiName').textContent = `File: ${this.fileName}`;
      document.getElementById('ht37TbuiSize').textContent = `Size: ${(this.fileSize / 1024).toFixed(1)} KB`;

      // 1. Diagnostic Header Output (First 32 bytes)
      let hexHeader = 'Header (0x00-0x1F): ';
      for (let i = 0; i < Math.min(32, buf.length); i++) {
        hexHeader += buf[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
      }
      // Add ASCII representation
      let ascii = ' | ASCII: ';
      for (let i = 0; i < Math.min(32, buf.length); i++) {
        const c = buf[i];
        ascii += (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
      }
      document.getElementById('ht37TbuiHexDump').textContent = hexHeader + ascii;

      // 2. Scan for TBUI & PUSH tags across file
      let tagsFound = [];
      for (let i = 0; i < buf.length - 4; i++) {
        if (buf[i] === 0x54 && buf[i+1] === 0x42 && buf[i+2] === 0x55 && buf[i+3] === 0x49) {
          tagsFound.push(`TBUI@0x${i.toString(16).toUpperCase()}`);
        } else if (buf[i] === 0x50 && buf[i+1] === 0x55 && buf[i+2] === 0x53 && buf[i+3] === 0x48) {
          tagsFound.push(`PUSH@0x${i.toString(16).toUpperCase()}`);
        }
      }
      document.getElementById('ht37TbuiTag').textContent = tagsFound.length ? tagsFound.join(', ') : 'No ASCII Tag';

      // 3. Scan for Frame Descriptor Table
      // In TBUI / 5681: Frame descriptors are 16-byte structs:
      // uint16 width, uint16 height, uint16 format/type, uint16 flags, uint32 offset, uint32 length
      for (let i = 0; i < buf.length - 16; i += 2) {
        const w = view.getUint16(i, true);
        const h = view.getUint16(i + 2, true);
        const fmt = view.getUint16(i + 4, true);
        const flags = view.getUint16(i + 6, true);
        const off = view.getUint32(i + 8, true);
        const len = view.getUint32(i + 12, true);

        // Sanity check: valid watchface sprite dimensions (up to 360x360), valid file offset and length
        if (w >= 4 && w <= 360 && h >= 4 && h <= 360 && len >= 8 && len <= 300000) {
          if (off >= 32 && (off + len) <= buf.length) {
            // Confirm it's not pointing into itself
            if (!this.sprites.some(s => s.offset === off)) {
              this.sprites.push({
                index: this.sprites.length + 1,
                width: w,
                height: h,
                format: fmt,
                flags: flags,
                offset: off,
                length: len,
                descriptorOffset: i,
                decodeMode: fmt === 0 ? 'rgb565' : (fmt === 1 ? 'rle' : 'auto')
              });
            }
          }
        }
      }

      // 4. Fallback: If structured frame table had unique shifts, look for 32-bit offset chains
      if (this.sprites.length === 0) {
        this.scanOffsetChain();
      }

      document.getElementById('ht37TbuiCount').textContent = `Sprites Extracted: ${this.sprites.length}`;
      document.getElementById('ht37BtnDownloadAll').style.display = this.sprites.length ? 'inline-block' : 'none';

      this.renderGallery();
    },

    scanOffsetChain() {
      const buf = this.fileData;
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

      // Search for sequential offsets pointing into data section
      for (let i = 16; i < Math.min(2048, buf.length - 8); i += 4) {
        const off1 = view.getUint32(i, true);
        const off2 = view.getUint32(i + 4, true);

        if (off1 >= 256 && off1 < buf.length && off2 > off1 && off2 <= buf.length) {
          const len = off2 - off1;
          if (len >= 32 && len <= 260000) {
            // Probe square/rectangular dimension
            let guessedW = 48, guessedH = 48;
            if (len === 360 * 360 * 2) { guessedW = 360; guessedH = 360; }
            else if (len === 180 * 180 * 2) { guessedW = 180; guessedH = 180; }

            this.sprites.push({
              index: this.sprites.length + 1,
              width: guessedW,
              height: guessedH,
              format: 0,
              offset: off1,
              length: len,
              descriptorOffset: i,
              decodeMode: 'auto'
            });
          }
        }
      }
    },

    renderGallery() {
      const grid = document.getElementById('ht37TbuiGalleryGrid');
      grid.innerHTML = '';

      if (this.sprites.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#ef4444;">
            No TBUI frame tables recognized. Please check the header dump in the top bar.
          </div>
        `;
        return;
      }

      this.sprites.forEach((sprite) => {
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
          <div style="color:#e2e8f0; font-weight:700;">#${sprite.index}: ${sprite.width} × ${sprite.height} px</div>
          <div>Offset: 0x${sprite.offset.toString(16).toUpperCase().padStart(6, '0')} (${sprite.offset.toLocaleString()} B)</div>
          <div>Length: ${sprite.length.toLocaleString()} bytes</div>
          <div>Format ID: ${sprite.format} (Flags: ${sprite.flags || 0})</div>
        `;

        // Live Decoder Switcher for each individual sprite
        const select = document.createElement('select');
        select.className = 'ht37-mode-select';
        select.innerHTML = `
          <option value="rgb565_swap">RGB565 (5681 Byte-Swapped)</option>
          <option value="rgb565_le">RGB565 (ARM Standard LE)</option>
          <option value="rle_5681">RLE Compressed (Bluetrum)</option>
          <option value="argb4444">ARGB4444 (Alpha 4-bit)</option>
          <option value="alpha_mask">Alpha Mask (8-bit)</option>
        `;
        select.value = this.globalSwap ? 'rgb565_swap' : 'rgb565_le';
        select.addEventListener('change', () => {
          sprite.decodeMode = select.value;
          this.drawSpriteToCanvas(canvas, sprite, select.value);
        });

        const dlBtn = document.createElement('button');
        dlBtn.className = 'ht37-action-btn';
        dlBtn.textContent = '💾 Download PNG';
        dlBtn.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = `ht37_sprite_${sprite.index}_${sprite.width}x${sprite.height}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        card.appendChild(canvasBox);
        card.appendChild(meta);
        card.appendChild(select);
        card.appendChild(dlBtn);
        grid.appendChild(card);

        // Render initial canvas view
        this.drawSpriteToCanvas(canvas, sprite, select.value);
      });
    },

    reRenderAllCanvases() {
      this.sprites.forEach(sprite => {
        const canvas = document.getElementById(`ht37Canvas_${sprite.index}`);
        if (canvas) {
          const mode = this.globalSwap ? 'rgb565_swap' : 'rgb565_le';
          this.drawSpriteToCanvas(canvas, sprite, mode);
        }
      });
    },

    drawSpriteToCanvas(canvas, sprite, mode) {
      canvas.width = sprite.width;
      canvas.height = sprite.height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(sprite.width, sprite.height);
      const data = imgData.data;
      const buf = this.fileData;
      const totalPixels = sprite.width * sprite.height;

      if (mode === 'rgb565_swap' || mode === 'rgb565_le') {
        const swap = (mode === 'rgb565_swap');
        let src = sprite.offset;
        let dst = 0;

        for (let i = 0; i < totalPixels; i++) {
          if (src + 1 >= buf.length || src >= (sprite.offset + sprite.length)) break;
          const b0 = buf[src];
          const b1 = buf[src + 1];
          src += 2;

          const raw = swap ? ((b0 << 8) | b1) : ((b1 << 8) | b0);
          const r = Math.round(((raw >> 11) & 0x1F) * 255 / 31);
          const g = Math.round(((raw >> 5) & 0x3F) * 255 / 63);
          const b = Math.round((raw & 0x1F) * 255 / 31);
          const isTransparent = (raw === 0x0000);

          data[dst] = r;
          data[dst + 1] = g;
          data[dst + 2] = b;
          data[dst + 3] = isTransparent ? 0 : 255;
          dst += 4;
        }
      } else if (mode === 'rle_5681') {
        // Bluetrum Run-Length Unpacker
        let src = sprite.offset;
        let dst = 0;
        const maxSrc = sprite.offset + sprite.length;

        while (src < maxSrc && dst < data.length) {
          const count = buf[src++];
          if (src + 1 >= maxSrc) break;
          const b0 = buf[src++];
          const b1 = buf[src++];
          const raw = (b0 << 8) | b1;
          const r = Math.round(((raw >> 11) & 0x1F) * 255 / 31);
          const g = Math.round(((raw >> 5) & 0x3F) * 255 / 63);
          const b = Math.round((raw & 0x1F) * 255 / 31);
          const a = (raw === 0x0000) ? 0 : 255;

          const repeat = Math.max(1, count);
          for (let k = 0; k < repeat && dst < data.length; k++) {
            data[dst] = r;
            data[dst + 1] = g;
            data[dst + 2] = b;
            data[dst + 3] = a;
            dst += 4;
          }
        }
      } else if (mode === 'argb4444') {
        let src = sprite.offset;
        let dst = 0;
        for (let i = 0; i < totalPixels; i++) {
          if (src + 1 >= buf.length) break;
          const b0 = buf[src++];
          const b1 = buf[src++];
          const raw = (b1 << 8) | b0;
          data[dst] = Math.round(((raw >> 8) & 0xF) * 255 / 15);
          data[dst + 1] = Math.round(((raw >> 4) & 0xF) * 255 / 15);
          data[dst + 2] = Math.round((raw & 0xF) * 255 / 15);
          data[dst + 3] = Math.round(((raw >> 12) & 0xF) * 255 / 15);
          dst += 4;
        }
      } else if (mode === 'alpha_mask') {
        let src = sprite.offset;
        let dst = 0;
        for (let i = 0; i < totalPixels; i++) {
          if (src >= buf.length) break;
          const a = buf[src++];
          data[dst] = 255;
          data[dst + 1] = 255;
          data[dst + 2] = 255;
          data[dst + 3] = a;
          dst += 4;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }
  };

  window.TBUIDecompiler = TBUIDecompiler;

  // Mount floating button
  document.addEventListener('DOMContentLoaded', () => {
    const launcher = document.createElement('button');
    launcher.id = 'btnOpenTbuiDecompiler';
    launcher.innerHTML = '<span>⚡</span> TBUI / 5681 Sprite Decompiler';
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
    launcher.addEventListener('click', () => TBUIDecompiler.openModal());
    document.body.appendChild(launcher);
  });

})();