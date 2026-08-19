
class NetworkManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;
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
    const peerId = 'penfight-v2-' + rawCode.toLowerCase();

    if (typeof Peer === 'undefined') {
      if (onError) onError('PeerJS library not loaded. Please check your internet connection.');
      return;
    }

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('Host peer initialized:', id);
        if (onRoomReady) onRoomReady(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        console.log('Incoming connection from guest...');
        this.conn = conn;
        this.setupConnection(onGuestConnected, onData, onError);
      });

      this.peer.on('error', (err) => {
        console.error('Host peer error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with fresh code
          this.initHost(onRoomReady, onGuestConnected, onData, onError);
          return;
        }
        if (onError) onError(err.type || 'Connection error');
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
      if (onError) onError('Please enter a valid 4-digit room code.');
      return;
    }
    this.roomCode = 'PEN-' + cleanCode;
    const hostPeerId = 'penfight-v2-' + cleanCode.toLowerCase();

    if (typeof Peer === 'undefined') {
      if (onError) onError('PeerJS library not loaded. Please check your internet connection.');
      return;
    }

    try {
      this.peer = new Peer(null, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (myId) => {
        console.log('Guest peer ready (' + myId + '), connecting to ' + hostPeerId);
        this.conn = this.peer.connect(hostPeerId, { reliable: true });
        this.setupConnection(onConnected, onData, onError);
      });

      this.peer.on('error', (err) => {
        console.error('Guest peer error:', err);
        if (onError) onError(err.type || 'Could not connect to room. Please check the code.');
      });
    } catch (e) {
      if (onError) onError(e.message);
    }
  }

  setupConnection(onConnected, onData, onError) {
    if (!this.conn) return;

    this.conn.on('open', () => {
      console.log('WebRTC DataChannel successfully connected!');
      this.isConnected = true;
      if (onConnected) onConnected(this.isHost ? 'host' : 'guest');
    });

    this.conn.on('data', (data) => {
      if (onData) onData(data);
    });

    this.conn.on('close', () => {
      console.log('Peer connection disconnected');
      this.isConnected = false;
      if (this.game) this.game.handlePeerDisconnect();
    });

    this.conn.on('error', (err) => {
      console.error('DataChannel error:', err);
      if (onError) onError(err);
    });
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch (err) {
        console.error('Error sending packet:', err);
      }
    }
  }

  cleanup() {
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
