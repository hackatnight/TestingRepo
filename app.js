const btnConnect = document.getElementById('btnConnect');
const btnDisconnect = document.getElementById('btnDisconnect');
const btnClear = document.getElementById('btnClear');
const statusDiv = document.getElementById('status');
const logView = document.getElementById('log');

let bluetoothDevice = null;
let gattServer = null;

function log(msg) {
  const time = new Date().toISOString().substring(11, 23);
  logView.textContent += `[${time}] ${msg}\n`;
  logView.scrollTop = logView.scrollHeight;
}

function setStatus(text) {
  statusDiv.textContent = `Status: ${text}`;
}

btnClear.addEventListener('click', () => {
  logView.textContent = '';
});

btnConnect.addEventListener('click', async () => {
  if (!navigator.bluetooth) {
    alert('Web Bluetooth is not supported in this browser. Please use Chrome or Edge on desktop/Android.');
    return;
  }

  try {
    setStatus('Requesting Bluetooth Device...');
    log('Scanning for BLE devices...');

    // FitCloud devices often use proprietary 16-bit or 128-bit service UUIDs.
    // acceptAllDevices allows picking any visible BLE peripheral.
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        'generic_access',
        'device_information',
        // Common FitCloud / Realtek custom service UUIDs:
        '0000fee7-0000-1000-8000-00805f9b34fb',
        '00006a40-0000-1000-8000-00805f9b34fb'
      ]
    });

    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    setStatus(`Connecting to ${bluetoothDevice.name || bluetoothDevice.id}...`);
    log(`Device selected: ${bluetoothDevice.name || '(unnamed)'} [${bluetoothDevice.id}]`);

    gattServer = await bluetoothDevice.gatt.connect();
    setStatus('Connected. Enumerating GATT services...');
    log('GATT Server connected.');

    btnConnect.disabled = true;
    btnDisconnect.disabled = false;

    await enumerateServices(gattServer);

  } catch (error) {
    log(`Connection failed: ${error.message}`);
    setStatus('Connection error');
  }
});

btnDisconnect.addEventListener('click', () => {
  if (bluetoothDevice && bluetoothDevice.gatt.connected) {
    log('Disconnecting...');
    bluetoothDevice.gatt.disconnect();
  }
});

function onDisconnected() {
  log('Device disconnected.');
  setStatus('Disconnected');
  btnConnect.disabled = false;
  btnDisconnect.disabled = true;
}

async function enumerateServices(server) {
  try {
    const services = await server.getPrimaryServices();
    log(`Discovered ${services.length} primary service(s):`);

    for (const service of services) {
      log(` -> Service UUID: ${service.uuid}`);
      try {
        const characteristics = await service.getCharacteristics();
        for (const ch of characteristics) {
          const props = [];
          if (ch.properties.read) props.push('read');
          if (ch.properties.write) props.push('write');
          if (ch.properties.writeWithoutResponse) props.push('writeWithoutResponse');
          if (ch.properties.notify) props.push('notify');
          if (ch.properties.indicate) props.push('indicate');

          log(`     Char: ${ch.uuid} [${props.join(', ')}]`);

          // Automatically subscribe to notifications if supported
          if (ch.properties.notify || ch.properties.indicate) {
            try {
              await ch.startNotifications();
              ch.addEventListener('characteristicvaluechanged', (e) => {
                const val = new Uint8Array(e.target.value.buffer);
                const hex = Array.from(val).map(b => b.toString(16).padStart(2, '0')).join(' ');
                log(`   << Notify [${ch.uuid}]: ${hex}`);
              });
              log(`     Subscribed to notifications on ${ch.uuid}`);
            } catch (err) {
              log(`     Could not subscribe to ${ch.uuid}: ${err.message}`);
            }
          }
        }
      } catch (err) {
        log(`     Could not query characteristics for ${service.uuid}: ${err.message}`);
      }
    }
    setStatus('Ready (GATT enumerated)');
  } catch (err) {
    log(`Service discovery error: ${err.message}`);
  }
}