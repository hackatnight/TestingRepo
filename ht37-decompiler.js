/**
 * ============================================================================
 * 🎨 HT37 DIAL DECOMPILER & LAYER STUDIO (ht37-decompiler.js)
 * Little-Endian RGB565 + .PGL Sprite Sheet Unpacker
 * ============================================================================
 */
(function(window) {
  'use strict';

  const COMPONENT_META = {
    1:  { type: 'digitalClock', name: '🕓 Digital Time',    icon: '🕓', color: '#ffffff', accent: '#00e5ff' },
    2:  { type: 'date',         name: '📅 Date Calendar',   icon: '📅', color: '#00e5ff', accent: '#ffffff' },
    3:  { type: 'steps',        name: '👟 Steps Count',     icon: '👟', color: '#ffab00', accent: '#ffe57f' },
    4:  { type: 'barometer',    name: '📍 Distance (Mi)',   icon: '📍', color: '#00e676', accent: '#69f0ae' },
    5:  { type: 'barometer',    name: '🔥 Calories (KCAL)', icon: '🔥', color: '#ff5252', accent: '#ff8a80' },
    6:  { type: 'heartrate',    name: '❤️ Heart Rate (BPM)',icon: '❤️', color: '#ff5252', accent: '#ff8a80' },
    7:  { type: 'weather',      name: '🌤️ Live Weather',    icon: '🌤️', color: '#ffab00', accent: '#00e5ff' },
    8:  { type: 'battery',      name: '🔋 Battery Status',  icon: '🔋', color: '#00e5ff', accent: '#00e676' },
    9:  { type: 'barometer',    name: '💤 Sleep Monitor',   icon: '💤', color: '#9c27b0', accent: '#ba68c8' },
    10: { type: 'digitalClock', name: '🕓 Main Time',       icon: '🕓', color: '#ffffff', accent: '#00e5ff' }
  };

  // Convert 16-bit Little-Endian RGB565 to HTML5 Canvas
  function decodeRGB565ToCanvas(u8Array, offset, width, height, isBigEndian = false) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    let p = 0;
    for (let i = 0; i < width * height; i++) {
      const idx = offset + (i * 2);
      if (idx + 1 >= u8Array.length) break;
      const b0 = u8Array[idx];
      const b1 = u8Array[idx + 1];

      // Little-Endian RGB565 (b0 = low byte, b1 = high byte)
      const raw = isBigEndian ? ((b0 << 8) | b1) : ((b1 << 8) | b0);

      const r = ((raw >> 11) & 0x1F) * 255 / 31;
      const g = ((raw >> 5) & 0x3F) * 255 / 63;
      const b = (raw & 0x1F) * 255 / 31;

      data[p]     = Math.round(r);
      data[p + 1] = Math.round(g);
      data[p + 2] = Math.round(b);
      data[p + 3] = (raw === 0x0000 && width < 360) ? 0 : 255;
      p += 4;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // Decompile .PGL Sprite Sheet Layer
  function decompilePglLayer(u8Array, filename) {
    const view = new DataView(u8Array.buffer, u8Array.byteOffset, u8Array.byteLength);
    const spriteCount = 12; // Standard Topstep sprite strip count
    const sprites = [];

    // Parse Sprite Lengths table (starting around byte 40)
    let lengths = [];
    for (let i = 0; i < spriteCount; i++) {
      const len = view.getUint16(40 + (i * 2), true);
      lengths.push(len > 0 && len < 40000 ? len : 2000);
    }

    // Determine width and height
    const firstLen = lengths[0];
    let w = 20, h = 50; // Default clock digit
    if (firstLen <= 350) { w = 16; h = 10; }       // Small icon
    else if (firstLen <= 1800) { w = 24; h = 36; }  // Complication digit
    else if (firstLen <= 2200) { w = 20; h = 50; }  // Clock digit

    let curOffset = 64; // Data begins at offset 64
    for (let i = 0; i < spriteCount; i++) {
      const spriteCanvas = decodeRGB565ToCanvas(u8Array, curOffset, w, h, false);
      sprites.push({ index: i, canvas: spriteCanvas, width: w, height: h });
      curOffset += lengths[i];
      if (curOffset >= u8Array.length) break;
    }

    return { filename, spriteCount: sprites.length, sprites, w, h };
  }

  // Master BIN Decompiler
  async function decompileFitCloudBin(arrayBuffer, filename = "dial.bin") {
    const u8 = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);

    let tbuiOffset = 1024;
    const magic = String.fromCharCode(...u8.slice(0, 7));
    if (magic === "TOPSTEP") {
      tbuiOffset = view.getUint32(0x24, true) || 1024;
    } else if (String.fromCharCode(...u8.slice(0, 4)) === "TBUI") {
      tbuiOffset = 0;
    }

    const tableRelOffset = view.getUint32(tbuiOffset + 16, true) || 64;
    const itemCount = view.getUint32(tbuiOffset + 20, true) || 10;
    const screenW = view.getUint16(tbuiOffset + 32, true) || 360;
    const screenH = view.getUint16(tbuiOffset + 34, true) || 360;

    const result = {
      filename,
      fileSize: u8.length,
      screenW,
      screenH,
      tbuiOffset,
      itemCount,
      items: [],
      backgroundCanvas: null
    };

    // Extract Background in Little-Endian RGB565 (Offset 89,256)
    const bgByteLength = screenW * screenH * 2;
    if (u8.length >= bgByteLength) {
      const bgOffset = u8.length - bgByteLength;
      result.backgroundCanvas = decodeRGB565ToCanvas(u8, bgOffset, screenW, screenH, false);
    }

    // Parse Component Table
    const tableAbsOffset = tbuiOffset + tableRelOffset;
    for (let i = 0; i < itemCount; i++) {
      const itemOff = tableAbsOffset + (i * 32);
      if (itemOff + 32 > u8.length) break;

      const id = u8[itemOff];
      const type = u8[itemOff + 1];
      const flags = view.getUint16(itemOff + 2, true);
      const x = view.getUint16(itemOff + 4, true);
      const y = view.getUint16(itemOff + 6, true);
      const meta = COMPONENT_META[id] || { type: 'customText', name: `Complication #${id}`, icon: '📌', color: '#fff', accent: '#00e5ff' };

      result.items.push({
        index: i,
        id,
        type: meta.type,
        flags,
        x_tl: x,
        y_tl: y,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        accent: meta.accent,
        rawOffset: itemOff
      });
    }

    return result;
  }

  window.openDecompilerModal = function() {
    const modal = document.getElementById('dialDecompilerModal');
    if (modal) modal.style.display = 'flex';
  };

  window.closeDecompilerModal = function() {
    const modal = document.getElementById('dialDecompilerModal');
    if (modal) modal.style.display = 'none';
  };

  window.handleModalFileSelect = async function(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;
    await processDialBinary(file);
  };

  async function processDialBinary(file) {
    if (typeof log === 'function') log(`📂 Processing dial file: ${file.name} (${Math.round(file.size / 1024)} KB)...`, 'ok');
    try {
      const buf = await file.arrayBuffer();

      // Check if it's a .PGL sprite sheet or .BIN container
      if (file.name.endsWith('.pgl')) {
        const pgl = decompilePglLayer(new Uint8Array(buf), file.name);
        renderPglSprites(pgl);
        return;
      }

      const result = await decompileFitCloudBin(buf, file.name);
      window.lastDecompiledDial = result;

      const infoEl = document.getElementById('modalFileInfo');
      if (infoEl) {
        infoEl.innerHTML = `<b>📁 ${result.filename}</b> (${Math.round(result.fileSize / 1024)} KB) • <b>${result.screenW}×${result.screenH} Circle</b> • <b>10 Layers Extracted</b>`;
      }

      const grid = document.getElementById('modalAssetGrid');
      if (grid) {
        grid.innerHTML = '';

        if (result.backgroundCanvas) {
          const bgCard = document.createElement('div');
          bgCard.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(0,229,255,0.4);border-radius:4px;padding:6px 4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
          
          const thumb = document.createElement('canvas');
          thumb.width = 64;
          thumb.height = 64;
          const tctx = thumb.getContext('2d');
          tctx.drawImage(result.backgroundCanvas, 0, 0, 64, 64);
          thumb.style.cssText = 'border-radius:50%;border:1px solid #00e5ff;margin:0 auto 4px auto;display:block;box-shadow:0 0 8px rgba(0,229,255,0.3);';

          bgCard.appendChild(thumb);
          bgCard.innerHTML += `<div style="color:#00e5ff;font-weight:bold;">🖼️ Background</div><div style="color:#aaa;">${result.screenW}×${result.screenH}</div>`;
          grid.appendChild(bgCard);
        }

        result.items.forEach((item) => {
          const card = document.createElement('div');
          card.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:6px 4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
          card.innerHTML = `
            <div style="font-size:16px;margin-bottom:2px;">${item.icon}</div>
            <div style="color:#fff;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
            <div style="color:var(--accent,#00e5ff);margin-top:2px;">(${item.x_tl}, ${item.y_tl})</div>
          `;
          grid.appendChild(card);
        });
      }

      const stageBtn = document.getElementById('btnModalStage');
      if (stageBtn) stageBtn.style.display = 'inline-block';

      // Automatically render the real extracted background on the watch canvas
      if (result.backgroundCanvas && typeof window.setCustomBackground === 'function') {
        window.setCustomBackground(result.backgroundCanvas);
      }

      if (typeof log === 'function') log(`🎉 Extracted ${result.filename} background in full color! Ready to sync.`, 'ok');

    } catch (err) {
      if (typeof log === 'function') log(`❌ Decompile error: ${err.message}`, 'err');
    }
  }

  // Display extracted sprites from .PGL files
  function renderPglSprites(pgl) {
    const grid = document.getElementById('modalAssetGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = 'grid-column: 1 / -1; font-size:10px; color:#00e5ff; font-weight:bold; margin-bottom:4px; font-family:var(--font-mono);';
    header.innerHTML = `🧩 Extracted Sprite Sheet: ${pgl.filename} (${pgl.spriteCount} sprites @ ${pgl.w}×${pgl.h}px)`;
    grid.appendChild(header);

    pgl.sprites.forEach((sp) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(0,229,255,0.25);border-radius:4px;padding:4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
      sp.canvas.style.cssText = 'background:#000;border:1px solid rgba(255,255,255,0.15);border-radius:2px;display:block;margin:0 auto 3px auto;';
      card.appendChild(sp.canvas);
      card.innerHTML += `<div style="color:#fff;">Sprite #${sp.index}</div>`;
      grid.appendChild(card);
    });

    if (typeof log === 'function') log(`✨ Unpacked ${pgl.spriteCount} sprites from ${pgl.filename} into asset gallery!`, 'ok');
  }

  window.applyDecompiledToWatchface = function() {
    const dial = window.lastDecompiledDial;
    if (!dial) return;

    if (dial.backgroundCanvas && typeof window.setCustomBackground === 'function') {
      window.setCustomBackground(dial.backgroundCanvas);
    }

    if (typeof widgets !== 'undefined' && Array.isArray(widgets)) {
      widgets = [];
      if (typeof selectedWidgetId !== 'undefined') selectedWidgetId = null;

      dial.items.forEach((item, idx) => {
        if (item.x_tl === 0 && item.y_tl === 0 && item.id < 5) return;

        const bounds = (typeof getWidgetBounds === 'function')
          ? getWidgetBounds({ type: item.type, scale: 1 })
          : { w: 80, h: 40 };

        const centerX = Math.round(item.x_tl + bounds.w / 2);
        const centerY = Math.round(item.y_tl + bounds.h / 2);

        widgets.push({
          id: `layer_${item.id}_${Date.now()}_${idx}`,
          type: item.type,
          name: item.name,
          x: centerX,
          y: centerY,
          scale: 1,
          opacity: 1,
          visible: true,
          locked: false,
          color: item.color || '#ffffff',
          accent: item.accent || '#00e5ff',
          text: '',
          fwId: `0x${item.id.toString(16).padStart(2,'0')}`
        });
      });

      if (typeof renderLayerList === 'function') renderLayerList();
      if (typeof syncInspector === 'function') syncInspector();
      if (typeof renderCanvas === 'function') renderCanvas();

      const badge = document.getElementById('layerCountBadge');
      if (badge) badge.textContent = widgets.length;

      if (typeof log === 'function') log(`🎯 Synced ${widgets.length} real layers and background from ${dial.filename} into studio!`, 'ok');
    }
  };

  window.initModalDrag = function() {
    const modal = document.getElementById('dialDecompilerModal');
    const handle = document.getElementById('decompilerDragHandle');
    if (!modal || !handle) return;

    let isDragging = false, startX, startY, initLeft, initTop;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = modal.offsetLeft;
      initTop = modal.offsetTop;
      handle.style.cursor = 'grabbing';

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        modal.style.left = (initLeft + (ev.clientX - startX)) + 'px';
        modal.style.top = (initTop + (ev.clientY - startY)) + 'px';
      };

      const onMouseUp = () => {
        isDragging = false;
        handle.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    if (window.initModalDrag) window.initModalDrag();
  });

})(typeof window !== 'undefined' ? window : this);