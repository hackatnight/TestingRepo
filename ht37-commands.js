/**
 * ============================================================================
 * 📋 HT37 MASTER PROTOCOL REGISTRY (ht37-commands.js)
 * ============================================================================
 * Single Source of Truth for all Outbound Commands and Inbound Watch Events.
 *
 * 🛠️ HOW TO ADD NEW COMMANDS & EVENTS AS THEY ARE DISCOVERED:
 * ----------------------------------------------------------------------------
 * 1. OUTBOUND COMMAND (App -> Watch):
 *    Add an entry to `HT37_COMMAND_REGISTRY` below:
 *    {
 *      id: 'MY_COMMAND_ID', // Unique string ID
 *      cmd: 0x02,           // Topstep Cmd (0x01=GET, 0x02=SET, 0x04=ALERT, 0x05=DATA, 0x07=MEDIA)
 *      key: 0xXX,           // Register key byte
 *      name: 'Human Name',
 *      cat: 'system' | 'alert' | 'sensor' | 'dial' | 'query',
 *      desc: 'What this command does',
 *      defaultPayload: [...] // Default byte array (optional)
 *    }
 *
 * 2. INBOUND EVENT (Watch -> App):
 *    Add an entry to `HT37_EVENT_REGISTRY` below:
 *    '0xCMD_0xKEY': {
 *      name: 'Event Title',
 *      desc: 'What user action or hardware state occurred',
 *      actionMap: { 1: 'Action A', 2: 'Action B' } // Optional byte-to-label map
 *    }
 * ============================================================================
 */

(function (window) {
  'use strict';

  // --- OUTBOUND COMMAND REGISTRY (App -> Watch) ---
  const HT37_COMMAND_REGISTRY = [
    // === SYSTEM, TIME & SETTINGS (Cmd: 0x02) ===
    { id: 'SYNC_TIME_6B',        cmd: 0x02, key: 0x01, name: 'Sync Time RTC (6B)',        cat: 'system', desc: 'Sets watch RTC clock and resets midnight step counter' },
    { id: 'ENABLE_ALERTS',       cmd: 0x02, key: 0x12, name: 'Master Alert Whitelist',    cat: 'system', desc: 'Writes [FF FF FF FF] mask so all notifications display', defaultPayload: [0xFF, 0xFF, 0xFF, 0xFF] },
    { id: 'SET_UNITS_24H_C',     cmd: 0x02, key: 0x18, name: 'Units: 24H + °C',           cat: 'system', desc: 'Function switch bank 0x03=0xEB', defaultPayload: [0x03, 0xEB] },
    { id: 'SET_UNITS_12H_C',     cmd: 0x02, key: 0x18, name: 'Units: 12H + °C',           cat: 'system', desc: 'Function switch bank 0x03=0xEF', defaultPayload: [0x03, 0xEF] },
    { id: 'PUSH_WEATHER_7B',     cmd: 0x02, key: 0x36, name: 'Push Weather (7B)',         cat: 'system', desc: 'Pushes sky code and temperatures to complications' },
    { id: 'PUSH_WEATHER_DIRECT', cmd: 0x02, key: 0x4C, name: 'Direct Weather Register',   cat: 'system', desc: 'Direct write key for weather complication (paired with read 0x4E)' },
    { id: 'FIND_WATCH_CHIME',    cmd: 0x02, key: 0x3B, name: 'Find Watch Chime',          cat: 'action', desc: 'Fires speaker chime and lights display', defaultPayload: [0x01] },
    { id: 'FACTORY_RESET',       cmd: 0x02, key: 0x40, name: 'Factory Reset',             cat: 'system', desc: 'Beeps and erases user flash (DANGEROUS)', isDangerous: true },
    { id: 'SWITCH_DIAL_SLOT',    cmd: 0x02, key: 0x70, name: 'Switch Dial Slot',          cat: 'dial',   desc: 'Swaps active watchface index [slotId]' },
    { id: 'SET_STEP_GOAL_10K',   cmd: 0x02, key: 0x03, name: 'Set Step Goal (10,000)',    cat: 'system', desc: 'Writes 10,000 daily step target (little-endian)', defaultPayload: [0x10, 0x27, 0x00, 0x00] },

    // === VERIFIED HARDWARE & TELEMETRY QUERIES (Cmd: 0x02 / 0x01) ===
    { id: 'MASTER_CONFIG_DUMP',  cmd: 0x02, key: 0x20, name: 'Master Config Dump',        cat: 'query',  desc: 'Triggers 164B hardware register table dump; watch replies on 0x02/0x21', defaultPayload: [0x01] },
    { id: 'QUERY_BATTERY_STATE', cmd: 0x02, key: 0x1B, name: 'Query Battery State',       cat: 'query',  desc: 'Queries charging, bars, and battery percent; watch replies on 0x02/0x1C', defaultPayload: [] },
    { id: 'QUERY_LCD_SPEC',      cmd: 0x02, key: 0x7D, name: 'Query LCD Panel Spec',      cat: 'query',  desc: 'Queries 360x360 resolution and LCD type 3; watch replies on 0x02/0x7E', defaultPayload: [0x01] },
    { id: 'QUERY_FLASH_SPACE',   cmd: 0x02, key: 0xAE, name: 'Query Dial Flash Boundary',  cat: 'query',  desc: 'Queries dial flash base and 524KB max size; watch replies on 0x02/0xAF', defaultPayload: [0x01] },
    { id: 'QUERY_STEP_GOAL_STAT',cmd: 0x01, key: 0x03, name: 'Query Step Goal Status',    cat: 'query',  desc: 'Queries active step goal; watch replies on 0x01/0x04', defaultPayload: [] },
    { id: 'QUERY_OTA_PRECHECK',  cmd: 0x01, key: 0x01, name: 'Query OTA / Firmware State',cat: 'query',  desc: 'Queries bootloader/firmware state; watch replies on 0x01/0x02', defaultPayload: [] },

    // === SENSORS & OPTICAL PPG (Cmd: 0x05) ===
    { id: 'PPG_LEDS_START',      cmd: 0x05, key: 0x23, name: 'Start Optical PPG LEDs',    cat: 'sensor', desc: 'Activates green optical PPG LEDs on back of watch', defaultPayload: [0x01, 0x00] },
    { id: 'PPG_LEDS_STOP',       cmd: 0x05, key: 0x23, name: 'Stop Optical PPG LEDs',     cat: 'sensor', desc: 'Deactivates green optical PPG LEDs on back of watch', defaultPayload: [0x00, 0x00] },
    { id: 'SYNC_TODAY_SUMMARY',  cmd: 0x05, key: 0x06, name: 'Sync Today Summary',        cat: 'sensor', desc: 'Requests today total steps, active kcal, and distance', defaultPayload: [0x00] },

    // === NOTIFICATIONS & ALERTS (Cmd: 0x04) ===
    { id: 'ALERT_CALL',          cmd: 0x04, key: 0x01, name: 'Incoming Call Alert',       cat: 'alert',  desc: 'Continuous vibration + caller prompt' },
    { id: 'ALERT_CALL_END',      cmd: 0x04, key: 0x02, name: 'End / Dismiss Call',        cat: 'alert',  desc: 'Dismisses incoming call vibration' },
    { id: 'ALERT_CALL_MUTE',     cmd: 0x04, key: 0x03, name: 'Mute Ringing Call',         cat: 'alert',  desc: 'Mutes call vibration without rejecting' },
    { id: 'ALERT_SMS',           cmd: 0x04, key: 0x04, name: 'SMS Text Message',          cat: 'alert',  desc: 'SMS icon + sender & body struct' },
    { id: 'ALERT_QQ',            cmd: 0x04, key: 0x05, name: 'QQ Notice',                 cat: 'alert',  desc: 'QQ icon notification' },
    { id: 'ALERT_WECHAT',        cmd: 0x04, key: 0x06, name: 'WeChat Notice',             cat: 'alert',  desc: 'WeChat green icon notification' },
    { id: 'ALERT_FACEBOOK',      cmd: 0x04, key: 0x07, name: 'Facebook Notice',           cat: 'alert',  desc: 'Facebook blue icon notification' },
    { id: 'ALERT_TWITTER',       cmd: 0x04, key: 0x08, name: 'X / Twitter Notice',        cat: 'alert',  desc: 'X / Twitter icon notification' },
    { id: 'ALERT_LINKEDIN',      cmd: 0x04, key: 0x09, name: 'LinkedIn Notice',           cat: 'alert',  desc: 'LinkedIn icon notification' },
    { id: 'ALERT_INSTAGRAM',     cmd: 0x04, key: 0x0A, name: 'Instagram Notice',          cat: 'alert',  desc: 'Instagram icon notification' },
    { id: 'ALERT_GENERIC',       cmd: 0x04, key: 0x0B, name: 'General App Notice',        cat: 'alert',  desc: 'Generic bell notice icon' },
    { id: 'ALERT_WHATSAPP',      cmd: 0x04, key: 0x0C, name: 'WhatsApp Notice',           cat: 'alert',  desc: 'WhatsApp icon notification' },
    { id: 'ALERT_LINE',          cmd: 0x04, key: 0x0D, name: 'LINE Notice',               cat: 'alert',  desc: 'LINE icon notification' },
    { id: 'ALERT_MESSENGER',     cmd: 0x04, key: 0x0E, name: 'FB Messenger Notice',    cat: 'alert',  desc: 'Messenger icon notification' },
    { id: 'ALERT_KAKAOTALK',     cmd: 0x04, key: 0x0F, name: 'KakaoTalk Notice',          cat: 'alert',  desc: 'KakaoTalk icon notification' },
    { id: 'ALERT_SKYPE',         cmd: 0x04, key: 0x10, name: 'Skype Notice',              cat: 'alert',  desc: 'Skype icon notification' },
    { id: 'ALERT_EMAIL',         cmd: 0x04, key: 0x11, name: 'Email Notice',              cat: 'alert',  desc: 'Email letter envelope icon' },
    { id: 'ALERT_TELEGRAM',      cmd: 0x04, key: 0x12, name: 'Telegram Notice',           cat: 'alert',  desc: 'Telegram paper airplane icon' },
    { id: 'ALERT_VIBER',         cmd: 0x04, key: 0x13, name: 'Viber Notice',              cat: 'alert',  desc: 'Viber purple phone icon' },
    { id: 'ALERT_SNAPCHAT',      cmd: 0x04, key: 0x15, name: 'Snapchat Notice',           cat: 'alert',  desc: 'Snapchat ghost icon' }
    // ➕ ADD NEW OUTBOUND COMMANDS HERE
  ];

  // --- INBOUND EVENT REGISTRY (Watch -> App) ---
  const HT37_EVENT_REGISTRY = {
    // === SYSTEM & HARDWARE REPLIES (Cmd: 0x02) ===
    '0x02_0x1C': { name: 'Battery: Status Report',         desc: 'Watch reported live battery percent, bars, and charging status' },
    '0x02_0x7E': { name: 'LCD: Display Geometry Spec',      desc: 'Watch reported LCD Type 3, 360x360 resolution' },
    '0x02_0xAF': { name: 'Flash: Storage Boundary Spec',    desc: 'Watch reported dial flash base sector and 524KB max boundary' },
    '0x02_0x21': { name: 'System: Master Config Dump',      desc: 'Watch dumped 164B register table (SoC, FW, MAC, Dials)' },
    '0x02_0x3C': { name: 'Find Phone: Triggered',          desc: 'User tapped Find Phone on watch; play alarm on host' },
    '0x02_0x7C': { name: 'Find Phone: Finished',           desc: 'Find Phone timed out or was dismissed' },
    '0x02_0x51': { name: 'DND: Toggle Notice',             desc: 'User toggled Do Not Disturb in watch quick settings' },
    '0x02_0xE5': { name: 'Alert: Display Active',          desc: 'Watch screen woke up with active alert prompt' },

    // === SPORTS & WORKOUT ENGINE (Cmd: 0x02, Key: 0xCA) ===
    '0x02_0xCA': {
      name: 'Sport: Workout Session Event',
      desc: 'Workout lifecycle state transition',
      actionMap: { 0: 'Stopped / Ended', 1: 'Running / Active', 2: 'Paused' }
    },

    // === MEDIA & HOST REMOTE BUS (Cmd: 0x07 & 0x02) ===
    '0x02_0x92': { name: 'Media: Widget Handshake Ping',   desc: 'Watch entered Music widget; requested current playback state' },
    '0x07_0x04': { name: 'Camera: Viewfinder Opened',      desc: 'Watch entered camera mode; open viewfinder on host' },
    '0x07_0x01': { name: 'Camera: Shutter Pressed',        desc: 'User tapped shutter on watch; capture photo!' },
    '0x07_0x05': { name: 'Camera: Closed',                 desc: 'Watch exited camera mode; close viewfinder on host' },
    '0x07_0x03': {
      name: 'Media: Action Triggered',
      desc: 'Watch sent media control button',
      actionMap: { 1: 'Pause', 2: 'Play', 3: 'Next Track', 4: 'Prev Track', 5: 'Vol Up', 6: 'Vol Down' }
    },

    // === TELEPHONY & ALERTS (Cmd: 0x04) ===
    '0x04_0x20': { name: 'Call: User Declined',            desc: 'User pressed End Call on watch touchscreen' }
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
    const testByte = (key === 0xCA || key === '0xCA' || key === 'CA') && valBytes.length >= 5
      ? valBytes[valBytes.length - 1]
      : (valBytes.length > 0 ? valBytes[0] : null);

    if (evt.actionMap && testByte !== null && evt.actionMap[testByte] !== undefined) {
      extra = ` -> State: ${evt.actionMap[testByte]}`;
    }
    return `[${evt.name}] ${evt.desc}${extra}`;
  }

  // --- COMMAND EXPLORER RUNTIME HELPERS ---
  window.sendExplorerCommand = async function() {
    if (!cmdChar || !bleServer || !bleServer.connected) {
      return log('ERROR: Connect & Bind to the watch first!', 'err');
    }
    const cmdStr = (document.getElementById('explorerCmd')?.value || '').trim();
    const keyStr = (document.getElementById('explorerKey')?.value || '').trim();
    const payloadStr = (document.getElementById('explorerPayload')?.value || '').trim();

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

})(typeof window !== 'undefined' ? window : this);