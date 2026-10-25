/**
 * ============================================================================
 * 🎨 HT37 DIAL DECOMPILER & LAYER STUDIO (ht37-decompiler.js)
 * Floating Draggable Decompiler & Layer Synchronizer
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

  function decodeRGB565ToCanvas(u8Array, offset, width, height, isBigEndian = true) {
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
      const raw = isBigEndian ? ((b0 << 8) | b1) : ((b1 << 8) | b0);

      const r = ((raw >> 11) & 0x1F) * 255 / 31;
      const g = ((raw >> 5) & 0x3F) * 255 / 63;
      const b = (raw & 0x1F) * 255 / 31;

      data[p]     = Math.round(r);
      data[p + 1] = Math.round(g);
      data[p + 2] = Math.round(b);
      data[p + 3] = 255;
      p += 4;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

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

    const tbuiMagic = String.fromCharCode(...u8.slice(tbuiOffset, tbuiOffset + 4));
    if (tbuiMagic !== "TBUI") {
      throw new Error(`Invalid magic: "${tbuiMagic}" (Expected "TBUI" at 0x${tbuiOffset.toString(16)})`);
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

    const bgByteLength = screenW * screenH * 2;
    if (u8.length >= bgByteLength) {
      const bgOffset = u8.length - bgByteLength;
      result.backgroundCanvas = decodeRGB565ToCanvas(u8, bgOffset, screenW, screenH, true);
    }

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
    if (typeof log === 'function') log(`📂 Decompiling dial binary: ${file.name} (${Math.round(file.size / 1024)} KB)...`, 'ok');
    try {
      const buf = await file.arrayBuffer();
      const result = await decompileFitCloudBin(buf, file.name);
      window.lastDecompiledDial = result;

      const infoEl = document.getElementById('modalFileInfo');
      if (infoEl) {
        infoEl.innerHTML = `<b>📁 ${result.filename}</b> (${Math.round(result.fileSize / 1024)} KB) • <b>${result.screenW}×${result.screenH} Circle</b> • <b>${result.items.length} Active Layers Unpacked</b>`;
      }

      const grid = document.getElementById('modalAssetGrid');
      if (grid) {
        grid.innerHTML = '';

        if (result.backgroundCanvas) {
          const bgCard = document.createElement('div');
          bgCard.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(0,229,255,0.4);border-radius:4px;padding:6px 4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
          
          const thumb = document.createElement('canvas');
          thumb.width = 56;
          thumb.height = 56;
          const tctx = thumb.getContext('2d');
          tctx.drawImage(result.backgroundCanvas, 0, 0, 56, 56);
          thumb.style.cssText = 'border-radius:50%;border:1px solid #00e5ff;margin:0 auto 4px auto;display:block;';

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
            <div style="color:var(--accent,#00e5ff);margin-top:2px;">TL: (${item.x_tl}, ${item.y_tl})</div>
          `;
          grid.appendChild(card);
        });
      }

      const stageBtn = document.getElementById('btnModalStage');
      if (stageBtn) stageBtn.style.display = 'inline-block';

      if (typeof log === 'function') log(`🎉 Unpacked ${result.items.length} complications from ${file.name}! Ready to sync.`, 'ok');

    } catch (err) {
      if (typeof log === 'function') log(`❌ Decompile error: ${err.message}`, 'err');
    }
  }

  window.applyDecompiledToWatchface = function() {
    const dial = window.lastDecompiledDial;
    if (!dial) return;

    if (dial.backgroundCanvas && typeof customBgImage !== 'undefined') {
      customBgImage = dial.backgroundCanvas;
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

  function initModalDrag() {
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
  }

  window.addEventListener('DOMContentLoaded', () => {
    initModalDrag();
  });

})(typeof window !== 'undefined' ? window : this);