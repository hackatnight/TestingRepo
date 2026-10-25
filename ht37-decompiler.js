/**
 * ============================================================================
 * 🎨 HT37 DIAL DECOMPILER & SPRITE EXTRACTOR (ht37-decompiler.js)
 * Modeled after dafit-canvas for Topstep / FitCloudPro IC_568X TBUI Binaries
 * ============================================================================
 */
(function(window) {
  'use strict';

  const COMPONENT_META = {
    1:  { name: 'Time Font (HH:MM)', icon: '🕓' },
    2:  { name: 'Date / Day',        icon: '📅' },
    3:  { name: 'Steps / Pedometer', icon: '👟' },
    4:  { name: 'Distance (Mi/Km)',  icon: '📍' },
    5:  { name: 'Calories (KCAL)',   icon: '🔥' },
    6:  { name: 'Heart Rate (BPM)',  icon: '❤️' },
    7:  { name: 'Weather / Temp',    icon: '🌤️' },
    8:  { name: 'Battery Status',    icon: '🔋' },
    9:  { name: 'Sleep Monitor',     icon: '💤' },
    10: { name: 'Status Icons',      icon: '⚙️' }
  };

  function decodeRGB565ToCanvas(u8Array, offset, width, height, isBigEndian = true, transparentKey = null) {
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
      const isTrans = (transparentKey !== null && raw === transparentKey) || (raw === 0xF81F);

      data[p]     = Math.round(r);
      data[p + 1] = Math.round(g);
      data[p + 2] = Math.round(b);
      data[p + 3] = isTrans ? 0 : 255;
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
      const meta = COMPONENT_META[id] || { name: `Complication #${id}`, icon: '📌' };

      result.items.push({
        index: i,
        id,
        type,
        flags,
        x,
        y,
        name: meta.name,
        icon: meta.icon,
        rawOffset: itemOff
      });
    }

    return result;
  }

  async function handleDialFileOpen(event) {
    const file = event.target.files ? event.target.files[0] : event;
    if (!file) return;
    await processDialFile(file);
  }

  window.handleDialFileDrop = async function(file) {
    if (!file) return;
    await processDialFile(file);
  };

  async function processDialFile(file) {
    if (typeof log === 'function') log(`📂 Decompiling dial binary: ${file.name} (${Math.round(file.size / 1024)} KB)...`, 'ok');
    try {
      const buf = await file.arrayBuffer();
      const result = await decompileFitCloudBin(buf, file.name);
      window.lastDecompiledDial = result;

      const infoEl = document.getElementById('decompileFileInfo');
      if (infoEl) {
        infoEl.innerHTML = `<b>📁 ${result.filename}</b> (${Math.round(result.fileSize / 1024)} KB) • <b>${result.screenW}×${result.screenH} Circle</b> • <b>${result.items.length} Active Complications Unpacked</b>`;
      }

      const badgeEl = document.getElementById('decompileStatusBadge');
      if (badgeEl) {
        badgeEl.textContent = `${result.items.length} Layers Extracted`;
        badgeEl.style.background = '#00e676';
        badgeEl.style.color = '#000';
      }

      const grid = document.getElementById('decompileAssetGrid');
      if (grid) {
        grid.innerHTML = '';

        if (result.backgroundCanvas) {
          const bgCard = document.createElement('div');
          bgCard.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(0,229,255,0.3);border-radius:4px;padding:6px 4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
          
          const thumb = document.createElement('canvas');
          thumb.width = 64;
          thumb.height = 64;
          const tctx = thumb.getContext('2d');
          tctx.drawImage(result.backgroundCanvas, 0, 0, 64, 64);
          thumb.style.cssText = 'border-radius:50%;border:1px solid #00e5ff;margin-bottom:4px;display:block;margin:0 auto 4px auto;';

          bgCard.appendChild(thumb);
          bgCard.innerHTML += `<div style="color:#00e5ff;font-weight:bold;">🖼️ Background</div><div style="color:#aaa;">${result.screenW}×${result.screenH}</div>`;
          grid.appendChild(bgCard);
        }

        result.items.forEach((item) => {
          const card = document.createElement('div');
          card.style.cssText = 'background:rgba(20,26,38,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:6px 4px;text-align:center;font-size:9px;font-family:var(--font-mono);';
          card.innerHTML = `
            <div style="font-size:16px;margin-bottom:2px;">${item.icon}</div>
            <div style="color:#fff;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
            <div style="color:var(--accent,#00e5ff);margin-top:2px;">(${item.x}, ${item.y})</div>
          `;
          grid.appendChild(card);
        });
      }

      const applyBtn = document.getElementById('btnApplyDecompiled');
      if (applyBtn) applyBtn.style.display = 'inline-block';

      if (typeof log === 'function') log(`🎉 Successfully unpacked ${result.items.length} complications + 360x360 background from ${file.name}!`, 'ok');

      if (result.backgroundCanvas && typeof customBgImage !== 'undefined') {
        customBgImage = result.backgroundCanvas;
        if (typeof renderCanvas === 'function') renderCanvas();
      }

    } catch (err) {
      if (typeof log === 'function') log(`❌ Decompile error: ${err.message}`, 'err');
    }
  }

  window.applyDecompiledToCanvas = function() {
    const dial = window.lastDecompiledDial;
    if (!dial) return;
    if (dial.backgroundCanvas && typeof customBgImage !== 'undefined') {
      customBgImage = dial.backgroundCanvas;
    }
    if (typeof widgets !== 'undefined' && Array.isArray(widgets)) {
      dial.items.forEach((item) => {
        let w = null;
        if (item.id === 1) w = widgets.find(x => x.type && x.type.includes('Clock'));
        else if (item.id === 2) w = widgets.find(x => x.type === 'date');
        else if (item.id === 3) w = widgets.find(x => x.type === 'steps');
        else if (item.id === 5) w = widgets.find(x => x.type === 'calories' || x.type === 'barometer');
        else if (item.id === 6) w = widgets.find(x => x.type === 'heartrate');
        else if (item.id === 7) w = widgets.find(x => x.type === 'weather');
        else if (item.id === 8) w = widgets.find(x => x.type === 'battery');

        if (w) {
          w.x = item.x;
          w.y = item.y;
          w.visible = true;
        }
      });
    }
    if (typeof renderCanvas === 'function') renderCanvas();
    if (typeof log === 'function') log(`🎯 Staged decompiled background & coordinates onto watch face canvas!`, 'ok');
  };

  window.addEventListener('DOMContentLoaded', () => {
    const chassis = document.getElementById('watchChassis');
    if (chassis) {
      chassis.addEventListener('dragover', (e) => { e.preventDefault(); chassis.style.filter = 'brightness(1.15)'; });
      chassis.addEventListener('dragleave', (e) => { e.preventDefault(); chassis.style.filter = ''; });
      chassis.addEventListener('drop', (e) => {
        e.preventDefault();
        chassis.style.filter = '';
        if (e.dataTransfer.files.length > 0) {
          window.handleDialFileDrop(e.dataTransfer.files[0]);
        }
      });
    }
  });

  window.handleDialFileOpen = handleDialFileOpen;
  window.HT37_DECOMPILER = {
    decodeRGB565ToCanvas,
    decompileFitCloudBin
  };

})(typeof window !== 'undefined' ? window : this);