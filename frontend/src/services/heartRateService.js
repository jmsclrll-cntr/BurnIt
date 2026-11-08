/**
 * heartRateService.js
 * 
 * Reusable Web Bluetooth service for connecting to Bluetooth Low Energy (BLE)
 * heart rate monitors (such as the Xiaomi Smart Band 9).
 * 
 * Standard Bluetooth SIG Specifications:
 * - Heart Rate Service UUID: 0x180D ('heart_rate')
 * - Heart Rate Measurement Characteristic UUID: 0x2A37 ('heart_rate_measurement')
 * 
 * Exposes:
 * - connect(): Requests device and subscribes to heart rate notifications
 * - disconnect(): Cleanly disconnects and releases wake lock
 * - reconnect(): Manually re-attempts connection to previously paired device
 * - onReading(cb): Subscribes to (bpm, timestamp) readings
 * - onStatusChange(cb): Subscribes to status transitions
 * - onError(cb): Subscribes to error messages
 * - isSupported(): Checks browser Web Bluetooth support
 */

// Standard Bluetooth SIG UUIDs
// Standard Bluetooth SIG UUIDs (16-bit and 128-bit canonical)
const HEART_RATE_SERVICE_UUID = 'heart_rate'; // 0x180D
const HEART_RATE_SERVICE_128 = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT_UUID = 'heart_rate_measurement'; // 0x2A37
const HEART_RATE_MEASUREMENT_128 = '00002a37-0000-1000-8000-00805f9b34fb';

class HeartRateService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;

    // Status: 'Not connected' | 'Connecting...' | 'Connected' | 'Disconnected'
    this.status = 'Not connected';
    this.deviceName = '';
    this.lastReadingTime = null;
    this.lastBpm = null;

    // Reconnection state
    this.autoRetryCount = 0;
    this.maxAutoRetries = 3;
    this.isManualDisconnect = false;
    this.reconnectTimeout = null;

    // Screen Wake Lock API handle
    this.wakeLock = null;

    // Callbacks listeners
    this.readingListeners = new Set();
    this.statusListeners = new Set();
    this.errorListeners = new Set();

    // Bind event handlers
    this.handleGattDisconnected = this.handleGattDisconnected.bind(this);
    this.handleCharacteristicValueChanged = this.handleCharacteristicValueChanged.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Re-acquire screen wake lock if tab is switched back while connected
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Check if the current browser supports Web Bluetooth
   */
  isSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  }

  /**
   * Register a callback for incoming BPM readings
   * Callback receives: (bpm: number, timestamp: Date)
   * Returns: unsubscribe function
   */
  onReading(callback) {
    this.readingListeners.add(callback);
    return () => this.readingListeners.delete(callback);
  }

  /**
   * Register a callback for status changes
   * Callback receives: { status, deviceName, autoRetryCount, lastReadingTime }
   */
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    // Emit immediate current state
    callback(this.getState());
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Register a callback for error messages
   * Callback receives: (errorMessage: string)
   */
  onError(callback) {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  /**
   * Current snapshot of service state
   */
  getState() {
    return {
      status: this.status,
      deviceName: this.deviceName,
      lastBpm: this.lastBpm,
      lastReadingTime: this.lastReadingTime,
      autoRetryCount: this.autoRetryCount,
      isConnected: this.status === 'Connected',
    };
  }

  /**
   * Update internal status and notify subscribers
   */
  updateStatus(newStatus) {
    this.status = newStatus;
    const state = this.getState();
    this.statusListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  /**
   * Emit error message to subscribers
   */
  emitError(message) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Request device via Web Bluetooth and initiate GATT connection
   * Must be called in response to a user gesture (button click).
   * 
   * Uses acceptAllDevices: true by default so Xiaomi Smart Band 9, Galaxy Watch,
   * and all nearby BLE devices appear in the browser picker, even if they do not
   * advertise the 0x180D UUID in their primary advertising packet.
   */
  async connect(options = {}) {
    this.clearScheduledReconnect();
    this.isManualDisconnect = false;
    this.autoRetryCount = 0;

    // 1. Verify Web Bluetooth availability
    if (!this.isSupported()) {
      const unsupportedMsg =
        'Web Bluetooth is not supported in this browser. Please open this app in Google Chrome on an Android phone or computer.';
      this.emitError(unsupportedMsg);
      this.updateStatus('Not connected');
      throw new Error(unsupportedMsg);
    }

    this.updateStatus('Connecting...');

    try {
      let selectedDevice = null;
      const useAllDevices = options.acceptAll !== false;

      if (useAllDevices) {
        try {
          // Mode A: acceptAllDevices displays every nearby BLE device (Xiaomi Band 9, etc.)
          // Mode A: acceptAllDevices displays every nearby BLE device (Garmin, Apple Watch, Galaxy, Polar, Xiaomi, etc.)
          selectedDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
              HEART_RATE_SERVICE_UUID,
              0x180d,
              HEART_RATE_SERVICE_128,
              'battery_service',
              0x180f,
              'device_information',
              0x180a,
            ],
          });
        } catch (allErr) {
          if (allErr.name === 'NotFoundError') {
            // User cancelled picker
            throw allErr;
          }
          console.warn('acceptAllDevices failed, trying filtered mode:', allErr);
        }
      }

      // Mode B: Fallback with name prefixes and heart_rate service filter
      // Mode B: Fallback with broad name prefixes and heart_rate service filter
      if (!selectedDevice) {
        selectedDevice = await navigator.bluetooth.requestDevice({
          filters: [
            { services: [HEART_RATE_SERVICE_UUID] },
            { namePrefix: 'Garmin' },
            { namePrefix: 'Polar' },
            { namePrefix: 'Wahoo' },
            { namePrefix: 'Heart' },
            { namePrefix: 'Galaxy' },
            { namePrefix: 'Watch' },
            { namePrefix: 'Band' },
            { namePrefix: 'Xiaomi' },
            { namePrefix: 'Smart Band' },
            { namePrefix: 'Band' },
            { namePrefix: 'Smart' },
            { namePrefix: 'Mi' },
            { namePrefix: 'Fitbit' },
            { namePrefix: 'Whoop' },
            { namePrefix: 'Amazfit' },
            { namePrefix: 'Huawei' },
          ],
          optionalServices: [
            HEART_RATE_SERVICE_UUID,
            0x180d,
            HEART_RATE_SERVICE_128,
            'battery_service',
            0x180f,
            'device_information',
            0x180a,
          ],
        });
      }

      this.device = selectedDevice;
      this.deviceName = selectedDevice.name || 'Bluetooth Smartwatch / Band';

      // 3. Attach disconnect listener
      this.device.removeEventListener('gattserverdisconnected', this.handleGattDisconnected);
      this.device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      // 4. Connect to GATT Server & subscribe to notifications
      await this.establishGattConnection();

      return true;
    } catch (err) {
      console.error('Bluetooth connection failed:', err);

      let userFriendlyMessage = 'Failed to connect to smartwatch or heart rate monitor.';
      if (err.name === 'NotFoundError') {
        userFriendlyMessage = 'Device selection was cancelled. Tap "Connect Smartwatch" to try again.';
      } else if (err.name === 'SecurityError') {
        userFriendlyMessage = 'Bluetooth permission was blocked by the browser. Please allow Bluetooth and Location permissions in Android settings.';
      } else if (err.message && err.message.toLowerCase().includes('user cancelled')) {
        userFriendlyMessage = 'Device selection was cancelled. Tap "Connect Smartwatch" to try again.';
      } else {
        userFriendlyMessage = err.message || userFriendlyMessage;
      }

      this.emitError(userFriendlyMessage);
      this.updateStatus('Not connected');
      throw err;
    }
  }

  /**
   * Establishes GATT connection and subscribes to heart_rate_measurement
   */
  async establishGattConnection() {
    if (!this.device || !this.device.gatt) {
      throw new Error('No Bluetooth device available to connect.');
    }

    // Connect to GATT server
    this.server = await this.device.gatt.connect();

    // Retrieve Primary Heart Rate Service across all standard UUID formats
    let service = null;
    const serviceCandidates = [HEART_RATE_SERVICE_UUID, 0x180d, HEART_RATE_SERVICE_128];
    for (const candidate of serviceCandidates) {
      try {
        service = await this.server.getPrimaryService(candidate);
        if (service) break;
      } catch {
        // try next candidate
      }
    }

    if (!service) {
      throw new Error(
        `Connected to "${this.deviceName}", but the standard Heart Rate Service was not found. Please enable "Heart Rate Broadcast / Sharing" on your smartwatch (Garmin, Apple Watch, Galaxy Watch, or Xiaomi Band).`
      );
    }

    // Retrieve Heart Rate Measurement Characteristic across all standard formats
    let characteristic = null;
    const charCandidates = [HEART_RATE_MEASUREMENT_UUID, 0x2a37, HEART_RATE_MEASUREMENT_128];
    for (const candidate of charCandidates) {
      try {
        characteristic = await service.getCharacteristic(candidate);
        if (characteristic) break;
      } catch {
        // try next candidate
      }
    }

    if (!characteristic) {
      throw new Error(
        `Connected to "${this.deviceName}", but could not subscribe to the Heart Rate Measurement characteristic (0x2A37).`
      );
    }

    this.characteristic = characteristic;

    // Subscribe to continuous live notifications
    await this.characteristic.startNotifications();
    this.characteristic.removeEventListener(
      'characteristicvaluechanged',
      this.handleCharacteristicValueChanged
    );
    this.characteristic.addEventListener(
      'characteristicvaluechanged',
      this.handleCharacteristicValueChanged
    );

    // Acquire Screen Wake Lock while connected
    await this.requestScreenWakeLock();

    // Reset retry counter and update status
    this.autoRetryCount = 0;
    this.updateStatus('Connected');
  }

      /**
       * Parse Bluetooth GATT Heart Rate Data Packet according to Bluetooth SIG:
       * - Byte 0: Flags
       *   - Bit 0: 0 = 8-bit Heart Rate Value, 1 = 16-bit Heart Rate Value
       * - Byte 1 (or 1-2): Heart Rate Measurement Value in BPM (little-endian if 16-bit)
       */
      handleCharacteristicValueChanged(event) {
        const value = event.target.value;
        if (!value || value.byteLength < 2) return;

        const flags = value.getUint8(0);
        // Bit 0 determines whether BPM is 8-bit or 16-bit
        const is16Bit = (flags & 0x01) !== 0;

        let bpm = 0;
        if (is16Bit) {
          // 16-bit little-endian value starting at byte offset 1
          bpm = value.getUint16(1, /* littleEndian = */ true);
        } else {
          // 8-bit value at byte offset 1
          bpm = value.getUint8(1);
        }

        // Sanity check valid human heart rate
        if (bpm > 30 && bpm < 255) {
          const timestamp = new Date();
          this.lastBpm = bpm;
          this.lastReadingTime = timestamp;

          // Notify all reading listeners
          this.readingListeners.forEach((listener) => {
            try {
              listener(bpm, timestamp);
            } catch (err) {
              console.error('Error in reading listener:', err);
            }
          });
        }
      }

      /**
       * Handle unexpected GATT server disconnection
       */
      handleGattDisconnected() {
        this.releaseScreenWakeLock();

        // If disconnect was requested manually by user, stop here
        if (this.isManualDisconnect) {
          this.updateStatus('Disconnected');
          return;
        }

        console.warn('Band disconnected unexpectedly.');

        // Auto-retry reconnection up to 3 times
        if (this.autoRetryCount < this.maxAutoRetries && this.device) {
          this.autoRetryCount += 1;
          const retryDelayMs = this.autoRetryCount * 1500; // 1.5s, 3.0s, 4.5s backoff
          this.updateStatus('Connecting...');

          this.reconnectTimeout = setTimeout(async () => {
            try {
              console.log(`Auto-reconnect attempt ${this.autoRetryCount} of ${this.maxAutoRetries}...`);
              await this.establishGattConnection();
            } catch (err) {
              console.warn(`Auto-reconnect attempt ${this.autoRetryCount} failed:`, err);
              if (this.autoRetryCount >= this.maxAutoRetries) {
                this.updateStatus('Disconnected');
                this.emitError('Connection lost. Please tap "Reconnect" to resume tracking.');
              }
            }
          }, retryDelayMs);
        } else {
          this.updateStatus('Disconnected');
          this.emitError('Connection lost. Tap "Reconnect" to pair again.');
        }
      }

  /**
   * Manual reconnect to previously paired device (or prompt if needed)
   */
  async reconnect() {
        this.clearScheduledReconnect();
        this.isManualDisconnect = false;
        this.autoRetryCount = 0;

        if (this.device && this.device.gatt) {
          this.updateStatus('Connecting...');
          try {
            await this.establishGattConnection();
            return true;
          } catch (err) {
            console.warn('Direct reconnect to existing device failed, falling back to picker:', err);
          }
        }

        // If direct reconnect failed or device handle missing, trigger fresh connect flow
        return this.connect();
      }

  /**
   * Disconnect cleanly from the device
   */
  async disconnect() {
        this.isManualDisconnect = true;
        this.clearScheduledReconnect();
        this.autoRetryCount = 0;

        try {
          if (this.characteristic) {
            try {
              await this.characteristic.stopNotifications();
            } catch {
              // Ignore if already disconnected
            }
            this.characteristic.removeEventListener(
              'characteristicvaluechanged',
              this.handleCharacteristicValueChanged
            );
            this.characteristic = null;
          }

          if (this.server && this.server.connected) {
            this.server.disconnect();
          }
          this.server = null;
        } catch (err) {
          console.warn('Error during disconnect:', err);
        } finally {
          this.releaseScreenWakeLock();
          this.updateStatus('Disconnected');
        }
      }

      /**
       * Clear any active reconnect timer
       */
      clearScheduledReconnect() {
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }

  /**
   * Screen Wake Lock API: Keep the phone screen awake during active workout
   */
  async requestScreenWakeLock() {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.wakeLock.addEventListener('release', () => {
              this.wakeLock = null;
            });
          } catch (err) {
            console.warn('Screen Wake Lock request failed:', err);
          }
        }
      }

  /**
   * Release Screen Wake Lock
   */
  async releaseScreenWakeLock() {
        if (this.wakeLock) {
          try {
            await this.wakeLock.release();
          } catch (err) {
            console.warn('Screen Wake Lock release failed:', err);
          }
          this.wakeLock = null;
        }
      }

  /**
   * Re-acquire Screen Wake Lock if user switches back to tab while connected
   */
  async handleVisibilityChange() {
        if (
          document.visibilityState === 'visible' &&
          this.status === 'Connected' &&
          !this.wakeLock
        ) {
          await this.requestScreenWakeLock();
        }
      }
    }

    // Export singleton instance for the entire app
    export const heartRateService = new HeartRateService();
    export default heartRateService;

