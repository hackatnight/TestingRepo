/**
 * ============================================================================
 * 📋 HT37 MASTER PROTOCOL REGISTRY (ht37-commands.js)
 * ============================================================================
 * Centralized, isolated command dictionary and event decoder for the HT37 watch.
 *
 * 🛠️ HOW TO ADD NEW COMMANDS & EVENTS AS THEY ARE DISCOVERED:
 * ----------------------------------------------------------------------------
 * 1. OUTBOUND COMMAND (App -> Watch):
 *    Add an entry to `HT37_COMMAND_REGISTRY` below:
 *    {
 *      id: 'MY_NEW_COMMAND', // Unique string ID
 *      cmd: 0x02,            // 0x01 (GET), 0x02 (SET), 0x04 (ALERT), etc.
 *      key: 0xXX,            // Register key byte
 *      name: 'Human Name',
 *      cat: 'system' | 'alert' | 'sensor' | 'dial' | 'query',
 *      desc: 'What this command does',
 *      defaultPayload: [...] // Optional default byte array
 *    }
 *
 * 2. INBOUND EVENT (Watch -> App):
 *    Add an entry to `HT37_EVENT_REGISTRY` below:
 *    '0xCMD_0xKEY': {
 *      name: 'Event Title',
 *      desc: 'What user action occurred on the watch',
 *      actionMap: { 1: 'Action A', 2: 'Action B' } // Optional payload byte mapping
 *    }
 * ============================================================================
 */

(function (window) {
  'use strict';

  // --- OUTBOUND COMMAND REGISTRY (App -> Watch) ---
  const HT37_COMMAND_REGISTRY = [
    // === SYSTEM, TIME & SETTINGS (Cmd: 0x02) ===
    { id: 'SYNC_TIME_6B',     cmd: 0x02, key: 0x01, name: 'Sync Time RTC (6B)',     cat: 'system', desc: 'Sets watch RTC clock and resets midnight step counter' },
    { id: 'ENABLE_ALERTS',    cmd: 0x02, key: 0x12, name: 'Master Alert Whitelist', cat: 'system', desc: 'Writes [FF FF FF FF] mask so all notifications display', defaultPayload: [0xFF, 0xFF, 0xFF, 0xFF] },
    { id: 'SET_UNITS_24H_C',  cmd: 0x02, key: 0x18, name: 'Units: 24H + °C',        cat: 'system', desc: 'Function switch bank 0x03=0xEB', defaultPayload: [0x03, 0xEB] },
    { id: 'SET_UNITS_12H_C',  cmd: 0x02, key: 0x18, name: 'Units: 12H + °C',        cat: 'system', desc: 'Function switch bank 0x03=0xEF', defaultPayload: [0x03, 0xEF] },
    { id: 'PUSH_WEATHER_7B',  cmd: 0x02, key: 0x36, name: 'Push Weather (7B)',      cat: 'system', desc: 'Pushes sky code and temperatures to complications' },
    { id: 'FIND_WATCH_CHIME', cmd: 0x02, key: 0x3B, name: 'Find Watch Chime',       cat: 'action', desc: 'Fires speaker chime and lights display', defaultPayload: [0x01] },
    { id: 'FACTORY_RESET',    cmd: 0x02, key: 0x40, name: 'Factory Reset',          cat: 'system', desc: 'Beeps and erases user flash (DANGEROUS)', isDangerous: true },
    { id: 'SWITCH_DIAL_SLOT', cmd: 0x02, key: 0x70, name: 'Switch Dial Slot',       cat: 'dial',   desc: 'Swaps active watchface index [slotId]' },

    // === NOTIFICATIONS & ALERTS (Cmd: 0x04) ===
    { id: 'ALERT_CALL',       cmd: 0x04, key: 0x01, name: 'Incoming Call Alert',    cat: 'alert',  desc: 'Continuous vibration + caller prompt' },
    { id: 'ALERT_CALL_END',   cmd: 0x04, key: 0x02, name: 'End / Dismiss Call',     cat: 'alert',  desc: 'Dismisses incoming call vibration' },
    { id: 'ALERT_CALL_MUTE',  cmd: 0x04, key: 0x03, name: 'Mute Ringing Call',      cat: 'alert',  desc: 'Mutes call vibration without rejecting' },
    { id: 'ALERT_SMS',        cmd: 0x04, key: 0x04, name: 'SMS Text Message',       cat: 'alert',  desc: 'SMS icon + sender & body struct' },
    { id: 'ALERT_QQ',         cmd: 0x04, key: 0x05, name: 'QQ Notice',              cat: 'alert',  desc: 'QQ icon notification' },
    { id: 'ALERT_WECHAT',     cmd: 0x04, key: 0x06, name: 'WeChat Notice',          cat: 'alert',  desc: 'WeChat green icon notification' },
    { id: 'ALERT_FACEBOOK',   cmd: 0x04, key: 0x07, name: 'Facebook Notice',        cat: 'alert',  desc: 'Facebook blue icon notification' },
    { id: 'ALERT_TWITTER',    cmd: 0x04, key: 0x08, name: 'X / Twitter Notice',     cat: 'alert',  desc: 'X / Twitter icon notification' },
    { id: 'ALERT_LINKEDIN',   cmd: 0x04, key: 0x09, name: 'LinkedIn Notice',        cat: 'alert',  desc: 'LinkedIn icon notification' },
    { id: 'ALERT_INSTAGRAM',  cmd: 0x04, key: 0x0A, name: 'Instagram Notice',       cat: 'alert',  desc: 'Instagram icon notification' },
    { id: 'ALERT_GENERIC',    cmd: 0x04, key: 0x0B, name: 'General App Notice',     cat: 'alert',  desc: 'Generic bell notice icon' },
    { id: 'ALERT_WHATSAPP',   cmd: 0x04, key: 0x0C, name: 'WhatsApp Notice',        cat: 'alert',  desc: 'WhatsApp icon notification' },
    { id: 'ALERT_LINE',       cmd: 0x04, key: 0x0D, name: 'LINE Notice',            cat: 'alert',  desc: 'LINE icon notification' },
    { id: 'ALERT_MESSENGER',  cmd: 0x04, key: 0x0E, name: 'FB Messenger Notice',    cat: 'alert',  desc: 'Messenger icon notification' },
    { id: 'ALERT_KAKAOTALK',  cmd: 0x04, key: 0x0F, name: 'KakaoTalk Notice',       cat: 'alert',  desc: 'KakaoTalk icon notification' },
    { id: 'ALERT_SKYPE',      cmd: 0x04, key: 0x10, name: 'Skype Notice',           cat: 'alert',  desc: 'Skype icon notification' },
    { id: 'ALERT_EMAIL',      cmd: 0x04, key: 0x11, name: 'Email Notice',           cat: 'alert',  desc: 'Email letter envelope icon' },
    { id: 'ALERT_TELEGRAM',   cmd: 0x04, key: 0x12, name: 'Telegram Notice',        cat: 'alert',  desc: 'Telegram paper airplane icon' },
    { id: 'ALERT_VIBER',      cmd: 0x04, key: 0x13, name: 'Viber Notice',           cat: 'alert',  desc: 'Viber purple phone icon' },
    { id: 'ALERT_SNAPCHAT',   cmd: 0x04, key: 0x15, name: 'Snapchat Notice',        cat: 'alert',  desc: 'Snapchat ghost icon' }
    // ➕ ADD NEW OUTBOUND COMMANDS HERE
  ];

  // --- INBOUND EVENT REGISTRY (Watch -> App) ---
  const HT37_EVENT_REGISTRY = {
    // === CAMERA REMOTE BUS (Cmd: 0x07) ===
    '0x07_0x04': { name: 'Camera: Viewfinder Opened', desc: 'Watch entered camera mode; open viewfinder on host' },
    '0x07_0x01': { name: 'Camera: Shutter Pressed',   desc: 'User tapped shutter on watch; capture photo!' },
    '0x07_0x05': { name: 'Camera: Closed',            desc: 'Watch exited camera mode; close viewfinder on host' },

    // === MEDIA / MUSIC REMOTE BUS (Cmd: 0x07) ===
    '0x07_0x03': {
      name: 'Media: Action Triggered',
      desc: 'Watch sent media control button',
      actionMap: { 1: 'Pause', 2: 'Play', 3: 'Next Track', 4: 'Prev Track', 5: 'Vol Up', 6: 'Vol Down' }
    },

    // === TELEPHONY & HARDWARE INTERACTIONS ===
    '0x02_0x3C': { name: 'Find Phone: Triggered',     desc: 'User tapped Find Phone on watch; play alarm on host' },
    '0x02_0x7C': { name: 'Find Phone: Finished',      desc: 'Find Phone timed out or was dismissed' },
    '0x04_0x20': { name: 'Call: User Declined',       desc: 'User pressed End Call on watch touchscreen' },
    '0x02_0x51': { name: 'DND: Toggle Notice',        desc: 'User toggled Do Not Disturb in quick settings' },
    '0x02_0xE5': { name: 'Alert: Display Active',     desc: 'Watch screen woke up with active alert prompt' }
    // ➕ ADD NEW INCOMING WATCH EVENTS HERE
  };

  // --- HELPER LOOKUP FUNCTIONS ---
  function getWatchCommand(id) {
    return HT37_COMMAND_REGISTRY.find(cmd => cmd.id === id) || null;
  }

  function getWatchEvent(cmd, key) {
    const hexCmd = '0x' + (Number(cmd) || 0).toString(16).padStart(2, '0').toUpperCase();
    const hexKey = '0x' + (Number(key) || 0).toString(16).padStart(2, '0').toUpperCase();
    return HT37_EVENT_REGISTRY[`${hexCmd}_${hexKey}`] || null;
  }

  function formatWatchEvent(cmd, key, valBytes = []) {
    const evt = getWatchEvent(cmd, key);
    if (!evt) return null;
    let extra = '';
    if (evt.actionMap && valBytes.length > 0) {
      extra = ` -> ${evt.actionMap[valBytes[0]] || 'Code ' + valBytes[0]}`;
    }
    return `[${evt.name}] ${evt.desc}${extra}`;
  }

  // Expose to window scope
  window.HT37_COMMAND_REGISTRY = HT37_COMMAND_REGISTRY;
  window.HT37_EVENT_REGISTRY = HT37_EVENT_REGISTRY;
  window.HT37 = {
    commands: HT37_COMMAND_REGISTRY,
    events: HT37_EVENT_REGISTRY,
    getCommand: getWatchCommand,
    getEvent: getWatchEvent,
    formatEvent: formatWatchEvent
  };


  // === HT37 COMMAND EXPLORER RUNTIME HELPERS ===
  window.sendExplorerCommand = async function() {
    if (!cmdChar || !bleServer || !bleServer.connected) {
      return log('ERROR: Connect & Bind to the watch first!', 'err');
    }
    const cmdStr = (document.getElementById('explorerCmd').value || '').trim();
    const keyStr = (document.getElementById('explorerKey').value || '').trim();
    const payloadStr = (document.getElementById('explorerPayload').value || '').trim();

    const cmd = parseInt(cmdStr, 16);
    const key = parseInt(keyStr, 16);
    if (isNaN(cmd) || isNaN(key)) return log('ERROR: Invalid Cmd or Key hex.', 'err');

    let payload = [];
    if (payloadStr.length > 0) {
      payload = payloadStr.split(/[\s,]+/).map(h => parseInt(h, 16)).filter(n => !isNaN(n));
    }

    const cmdHex = '0x' + cmd.toString(16).padStart(2, '0').toUpperCase();
    const keyHex = '0x' + key.toString(16).padStart(2, '0').toUpperCase();
    const sel = document.getElementById('explorerPresetSelect');
    const label = sel ? sel.options[sel.selectedIndex].text : 'Explorer Probe';

    log(`🧪 [Explorer]: Probing ${cmdHex}/${keyHex} [${payload.map(b=>b.toString(16).padStart(2,'0').toUpperCase()).join(' ')}] (${label})...`, 'ok');
    const { frame, seq } = buildFitCloudFrame(cmd, key, payload, 0x00);
    await enqueueBleWrite(cmdChar, frame, `Explorer(${cmdHex}/${keyHex}) seq=${seq}`);
  };

  window.advanceExplorerNext = function() {
    const sel = document.getElementById('explorerPresetSelect');
    if (!sel) return;
    if (sel.selectedIndex < sel.options.length - 1) {
      sel.selectedIndex++;
    } else {
      sel.selectedIndex = 0;
    }
    window.loadExplorerPreset(sel.value);
  };

  window.loadExplorerPreset = function(val) {
    if (!val) return;
    const parts = val.split('|');
    if (parts.length >= 3) {
      const cInput = document.getElementById('explorerCmd');
      const kInput = document.getElementById('explorerKey');
      const pInput = document.getElementById('explorerPayload');
      const descEl = document.getElementById('explorerPrediction');
      if (cInput) cInput.value = parts[0];
      if (kInput) kInput.value = parts[1];
      if (pInput) pInput.value = parts[2] || '';
      const desc = parts[4] || parts[3] || 'Predicted watch response';
      if (descEl) descEl.innerHTML = `💡 <b>Prediction:</b> ${desc}`;
    }
  };


  // === READ LIVE BATTERY OVER BLUETOOTH SIG (0x180F) ===
  window.readSigBattery = async function() {
    if (!bleServer || !bleServer.connected) {
      return log('ERROR: Connect & Bind to the watch first.', 'err');
    }
    try {
      log('🔋 Querying standard Bluetooth SIG Battery Service (0x180F / 0x2A19)...', 'ok');
      const bService = await bleServer.getPrimaryService(0x180f);
      const bChar = await bService.getCharacteristic(0x2a19);
      const val = await bChar.readValue();
      const batteryPct = val.getUint8(0);
      log(`🔋 LIVE BATTERY REPORT: ${batteryPct}% charge remaining`, 'ok');
      const descEl = document.getElementById('explorerPrediction');
      if (descEl) descEl.innerHTML = `🔋 <b>Live Battery:</b> Watch reports <b>${batteryPct}%</b> battery charge!`;
    } catch (err) {
      log(`ℹ️ SIG 0x180F read: ${err.message}. Trying L2 probe...`, 'warn');
      const { frame, seq } = buildFitCloudFrame(0x01, 0x03, [], 0x00);
      await enqueueBleWrite(cmdChar, frame, `BatteryProbe(0x01/0x03) seq=${seq}`);
    }
  };

})(typeof window !== 'undefined' ? window : this);