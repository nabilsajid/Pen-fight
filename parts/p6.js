class NetworkManager {
  constructor(game) {
    this.game = game;
    this.client = null;
    this.role = null; // 'host' or 'guest'
    this.roomCode = null;
    this.isConnected = false;
    this.topic = null;
    this.currentBrokerIndex = 0;
    this.brokers = [
      'wss://broker.hivemq.com:8884/mqtt',
      'wss://broker.emqx.io:8084/mqtt'
    ];
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  initHost(onRoomReady, onData, onError) {
    this.cleanup();
    this.role = 'host';
    const rawCode = this.generateRoomCode();
    this.roomCode = 'PEN-' + rawCode;
    this.topic = 'penfight/v10/' + rawCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Host] Subscribe error:', err);
          if (onError) onError('Could not initialize room. Retrying...');
          return;
        }
        console.log('[Host] Subscribed to unified room topic:', this.topic);
        this.isConnected = true;
        if (onRoomReady) onRoomReady(this.roomCode);
      });
    }, onData, onError);
  }

  joinRoom(inputCode, onConnected, onData, onError) {
    this.cleanup();
    this.role = 'guest';
    let cleanCode = (inputCode || '').trim().toUpperCase().replace('PEN-', '').replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      if (onError) onError('Please enter a 4-digit code (e.g. M5JL)');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;
    this.topic = 'penfight/v10/' + cleanCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Guest] Subscribe error:', err);
          if (onError) onError('Could not find room. Please check the code.');
          return;
        }
        console.log('[Guest] Subscribed to unified room topic:', this.topic);
        this.isConnected = true;
        if (onConnected) onConnected('guest');

        // Immediately send join signal and keep repeating until host responds
        const announceTimer = setInterval(() => {
          if (this.game.mode === 'online_guest' || !this.client || !this.client.connected) {
            clearInterval(announceTimer);
            return;
          }
          this.send({
            type: 'GUEST_JOINED',
            guestPenId: this.game.p2PenId,
            guestPaletteId: this.game.p2PaletteId
          });
        }, 400);

        setTimeout(() => clearInterval(announceTimer), 25000);
      });
    }, onData, onError);
  }

  connectBroker(onSubscribed, onData, onError) {
    const mqttLib = window.mqtt || (typeof mqtt !== 'undefined' ? mqtt : null);
    if (!mqttLib) {
      if (onError) onError('Multiplayer service loading, tap connect in a moment...');
      return;
    }

    try {
      const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
      const clientId = 'pf10_' + this.role + '_' + Math.random().toString(16).substring(2, 9);
      console.log('[Network] Connecting:', brokerUrl);

      this.client = mqttLib.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 2500,
        keepalive: 30
      });

      this.client.on('connect', () => {
        console.log('[Network] Connected to broker!');
        if (onSubscribed) onSubscribed();
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data && data.senderRole !== this.role) {
            if (onData) onData(data);
          }
        } catch (e) {
          console.error('[Network] Parse error:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[Network] Broker warning:', err);
        this.currentBrokerIndex++;
      });
    } catch (e) {
      console.error('[Network] Connect error:', e);
      if (onError) onError('Connection error. Please check your internet.');
    }
  }

  send(data) {
    if (this.client && this.client.connected && this.topic) {
      try {
        const payload = Object.assign({}, data, { senderRole: this.role });
        this.client.publish(this.topic, JSON.stringify(payload), { qos: 0 });
      } catch (err) {
        console.error('[Network] Send error:', err);
      }
    }
  }

  cleanup() {
    if (this.client) {
      try {
        if (this.topic) this.client.unsubscribe(this.topic);
        this.client.end(true);
      } catch (e) {}
      this.client = null;
    }
    this.isConnected = false;
  }
}
