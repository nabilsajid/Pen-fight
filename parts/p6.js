class NetworkManager {
  constructor(game) {
    this.game = game;
    this.client = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;
    this.topicIncoming = null;
    this.topicOutgoing = null;
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  initHost(onRoomReady, onGuestConnected, onData, onError) {
    this.cleanup();
    this.isHost = true;
    const rawCode = this.generateRoomCode();
    this.roomCode = 'PEN-' + rawCode;

    this.topicIncoming = 'penfight/v5/' + rawCode.toLowerCase() + '/guest_to_host';
    this.topicOutgoing = 'penfight/v5/' + rawCode.toLowerCase() + '/host_to_guest';

    this.connectMqtt(() => {
      this.client.subscribe(this.topicIncoming, (err) => {
        if (err) {
          if (onError) onError('Could not subscribe to room.');
          return;
        }
        console.log('[Host] Room open and ready:', this.roomCode);
        if (onRoomReady) onRoomReady(this.roomCode);
      });
    }, onGuestConnected, onData, onError);
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

    this.topicIncoming = 'penfight/v5/' + cleanCode.toLowerCase() + '/host_to_guest';
    this.topicOutgoing = 'penfight/v5/' + cleanCode.toLowerCase() + '/guest_to_host';

    this.connectMqtt(() => {
      this.client.subscribe(this.topicIncoming, (err) => {
        if (err) {
          if (onError) onError('Could not join room.');
          return;
        }
        console.log('[Guest] Joined room topic:', this.roomCode);
        this.isConnected = true;
        if (onConnected) onConnected('guest');

        // Announce presence to Host
        this.send({
          type: 'GUEST_JOINED',
          guestPenId: this.game.p2PenId,
          guestPaletteId: this.game.p2PaletteId
        });
      });
    }, onConnected, onData, onError);
  }

  connectMqtt(onSubscribed, onConnectedCallback, onData, onError) {
    if (typeof mqtt === 'undefined') {
      if (onError) onError('Multiplayer service loading, please tap again in a second.');
      return;
    }

    try {
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
      const clientId = 'pf_' + (this.isHost ? 'h_' : 'g_') + Math.random().toString(16).substring(2, 9);

      this.client = mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 2500,
        keepalive: 30
      });

      this.client.on('connect', () => {
        console.log('[Network] Connected to real-time relay broker!');
        if (onSubscribed) onSubscribed();
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data) {
            if (this.isHost && !this.isConnected && data.type === 'GUEST_JOINED') {
              this.isConnected = true;
              if (onConnectedCallback) onConnectedCallback('host');
            }
            if (onData) onData(data);
          }
        } catch (e) {
          console.error('[Network] JSON parse error:', e);
        }
      });

      this.client.on('error', (err) => {
        console.error('[Network] Relay error:', err);
        if (onError) onError(err.message || 'Connection error');
      });
    } catch (e) {
      if (onError) onError(e.message);
    }
  }

  send(data) {
    if (this.client && this.client.connected && this.topicOutgoing) {
      try {
        this.client.publish(this.topicOutgoing, JSON.stringify(data), { qos: 0 });
      } catch (err) {
        console.error('[Network] Send failed:', err);
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
