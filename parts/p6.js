class NetworkManager {
  constructor(game) {
    this.game = game;
    this.client = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;
    this.topicIncoming = null;
    this.topicOutgoing = null;
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
    this.isHost = true;
    const rawCode = this.generateRoomCode();
    this.roomCode = 'PEN-' + rawCode;

    this.topicIncoming = 'penfight/v7/' + rawCode.toLowerCase() + '/g2h';
    this.topicOutgoing = 'penfight/v7/' + rawCode.toLowerCase() + '/h2g';

    this.connectBroker(() => {
      this.client.subscribe(this.topicIncoming, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Host] Subscribe error:', err);
          if (onError) onError('Could not register room. Retrying...');
          return;
        }
        console.log('[Host] Room open on topic:', this.topicIncoming);
        if (onRoomReady) onRoomReady(this.roomCode);
      });
    }, onData, onError);
  }

  joinRoom(inputCode, onConnected, onData, onError) {
    this.cleanup();
    this.isHost = false;
    let cleanCode = (inputCode || '').trim().toUpperCase().replace('PEN-', '').replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      if (onError) onError('Please enter a valid 4-digit room code.');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;

    this.topicIncoming = 'penfight/v7/' + cleanCode.toLowerCase() + '/h2g';
    this.topicOutgoing = 'penfight/v7/' + cleanCode.toLowerCase() + '/g2h';

    this.connectBroker(() => {
      this.client.subscribe(this.topicIncoming, { qos: 0 }, (err) => {
        if (err) {
          console.error('[Guest] Subscribe error:', err);
          if (onError) onError('Could not connect to room. Retrying...');
          return;
        }
        console.log('[Guest] Subscribed to host topic:', this.topicIncoming);
        this.isConnected = true;
        if (onConnected) onConnected('guest');

        // Announce presence to Host with repeating broadcast until Host responds
        const announceTimer = setInterval(() => {
          if (this.game.mode === 'online_guest') {
            clearInterval(announceTimer);
            return;
          }
          this.send({
            type: 'GUEST_JOINED',
            guestPenId: this.game.p2PenId,
            guestPaletteId: this.game.p2PaletteId
          });
        }, 600);

        // Clear timer after 15s
        setTimeout(() => clearInterval(announceTimer), 15000);
      });
    }, onData, onError);
  }

  connectBroker(onSubscribed, onData, onError) {
    const mqttLib = window.mqtt || (typeof mqtt !== 'undefined' ? mqtt : null);
    if (!mqttLib) {
      if (onError) onError('Loading multiplayer engine, please tap again in a moment...');
      return;
    }

    try {
      const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
      const clientId = 'pf7_' + (this.isHost ? 'h_' : 'g_') + Math.random().toString(16).substring(2, 9);
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
          if (data && onData) {
            onData(data);
          }
        } catch (e) {
          console.error('[Network] Parse error:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[Network] Broker warning:', err);
        // Non-fatal: try backup broker
        this.currentBrokerIndex++;
      });
    } catch (e) {
      console.error('[Network] Connect error:', e);
      if (onError) onError('Connection error. Please check your internet connection.');
    }
  }

  send(data) {
    if (this.client && this.client.connected && this.topicOutgoing) {
      try {
        this.client.publish(this.topicOutgoing, JSON.stringify(data), { qos: 0 });
      } catch (err) {
        console.error('[Network] Send error:', err);
      }
    }
  }

  cleanup() {
    if (this.client) {
      try {
        if (this.topicIncoming) this.client.unsubscribe(this.topicIncoming);
        this.client.end(true);
      } catch (e) {}
      this.client = null;
    }
    this.isConnected = false;
  }
}
