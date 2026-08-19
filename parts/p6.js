class NetworkManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;
    this.heartbeatTimer = null;
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getIceConfig() {
    return {
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    };
  }

  initHost(onRoomReady, onGuestConnected, onData, onError) {
    this.cleanup();
    this.isHost = true;
    const rawCode = this.generateRoomCode();
    this.roomCode = 'PEN-' + rawCode;
    const peerId = 'penfight-v3-' + rawCode.toLowerCase();

    if (typeof Peer === 'undefined') {
      if (onError) onError('PeerJS library is loading, please try again in a moment.');
      return;
    }

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: this.getIceConfig()
      });

      this.peer.on('open', (id) => {
        console.log('[Host] Room created with Peer ID:', id);
        if (onRoomReady) onRoomReady(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Host] Guest incoming connection established!');
        this.conn = conn;
        this.setupConnection(onGuestConnected, onData, onError);
      });

      this.peer.on('error', (err) => {
        console.error('[Host] Peer error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with a different room code
          this.initHost(onRoomReady, onGuestConnected, onData, onError);
          return;
        }
        if (onError) onError(err.message || err.type || 'Connection error');
      });
    } catch (e) {
      if (onError) onError(e.message);
    }
  }

  joinRoom(inputCode, onConnected, onData, onError) {
    this.cleanup();
    this.isHost = false;
    let cleanCode = (inputCode || '').trim().toUpperCase().replace('PEN-', '').replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      if (onError) onError('Please enter a valid room code (e.g. ' + this.generateRoomCode() + ').');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;
    const hostPeerId = 'penfight-v3-' + cleanCode.toLowerCase();

    if (typeof Peer === 'undefined') {
      if (onError) onError('PeerJS library is loading, please try again in a moment.');
      return;
    }

    try {
      this.peer = new Peer(null, {
        debug: 1,
        config: this.getIceConfig()
      });

      this.peer.on('open', (myId) => {
        console.log('[Guest] Peer open with ID ' + myId + ', connecting to host:', hostPeerId);
        this.conn = this.peer.connect(hostPeerId, {
          reliable: true
        });
        this.setupConnection(onConnected, onData, onError);
      });

      this.peer.on('error', (err) => {
        console.error('[Guest] Peer error:', err);
        if (onError) onError(err.type === 'peer-unavailable' ? 'Room not found. Check that the code is correct and Player 1 is waiting.' : (err.message || err.type));
      });
    } catch (e) {
      if (onError) onError(e.message);
    }
  }

  setupConnection(onConnected, onData, onError) {
    if (!this.conn) return;

    let hasHandshaked = false;

    const finalizeOpen = () => {
      if (hasHandshaked) return;
      hasHandshaked = true;
      this.isConnected = true;
      console.log('[Network] WebRTC connection handshake complete! Role:', this.isHost ? 'HOST' : 'GUEST');

      this.startHeartbeat();

      if (onConnected) onConnected(this.isHost ? 'host' : 'guest');
    };

    this.conn.on('open', () => {
      console.log('[Network] DataChannel OPENED!');
      finalizeOpen();
    });

    this.conn.on('data', (data) => {
      if (data && data.type === 'PING') {
        this.send({ type: 'PONG' });
        return;
      }
      if (data && data.type === 'PONG') {
        return;
      }
      if (onData) onData(data);
    });

    this.conn.on('close', () => {
      console.log('[Network] Peer disconnected');
      this.isConnected = false;
      this.stopHeartbeat();
      if (this.game) this.game.handlePeerDisconnect();
    });

    this.conn.on('error', (err) => {
      console.error('[Network] DataChannel error:', err);
      if (onError) onError(err);
    });

    // Fallback: If DataChannel open event is delayed, ping every 400ms up to 3s
    let attempts = 0;
    const checkInterval = setInterval(() => {
      if (this.conn && this.conn.open) {
        finalizeOpen();
        clearInterval(checkInterval);
      }
      attempts++;
      if (attempts > 12) {
        clearInterval(checkInterval);
      }
    }, 250);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.conn && this.conn.open) {
        this.send({ type: 'PING' });
      }
    }, 2500);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch (err) {
        console.error('[Network] Packet send failed:', err);
      }
    }
  }

  cleanup() {
    this.stopHeartbeat();
    if (this.conn) {
      try { this.conn.close(); } catch(e){}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch(e){}
      this.peer = null;
    }
    this.isConnected = false;
  }
}
