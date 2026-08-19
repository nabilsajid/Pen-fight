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
      'wss://broker.emqx.io:8084/mqtt',
      'wss://test.mosquitto.org:8081/mqtt'
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
    this.topic = 'penfight/v9/' + rawCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Host] Subscription error:', err);
          if (onError) onError('Could not register room. Please try again.');
          return;
        }
        console.log('[Host] Room open on topic:', this.topic);
        if (onRoomReady) onRoomReady(this.roomCode);
      });
    }, onData, onError);
  }

  joinRoom(inputCode, onConnected, onData, onError) {
    this.cleanup();
    this.role = 'guest';
    let cleanCode = (inputCode || '').trim().toUpperCase().replace('PEN-', '').replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      if (onError) onError('Please enter a valid 4-digit room code.');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;
    this.topic = 'penfight/v9/' + cleanCode.toLowerCase();

    this.connectBroker(() => {
      this.client.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Guest] Subscription error:', err);
          if (onError) onError('Could not connect to room.');
          return;
        }
        console.log('[Guest] Subscribed to room topic:', this.topic);
        this.isConnected = true;
        if (onConnected) onConnected('guest');

        // Broadcast presence until match starts
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
        }, 500);

        setTimeout(() => clearInterval(announceTimer), 20000);
      });
    }, onData, onError);
  }

  connectBroker(onSubscribed, onData, onError) {
    const mqttLib = window.mqtt || (typeof mqtt !== 'undefined' ? mqtt : null);
    if (!mqttLib) {
      if (onError) onError('Multiplayer library loading, please try again in a moment.');
      return;
    }

    try {
      const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
      const clientId = 'pf9_' + this.role + '_' + Math.random().toString(16).substring(2, 9);
      console.log('[Network] Connecting to broker:', brokerUrl);

      this.client = mqttLib.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 3000,
        keepalive: 30
      });

      this.client.on('connect', () => {
        console.log('[Network] Connected to broker successfully!');
        if (onSubscribed) onSubscribed();
      });

      this.client.on('message', (topic, payload) => {
        try {
          const str = payload.toString();
          const data = JSON.parse(str);
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
      if (onError) onError('Connection error. Please check your network.');
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
