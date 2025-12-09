const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Express server start කිරීම
app.get('/', (req, res) => {
  res.send('Sahan-X WhatsApp Bot is Running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// WhatsApp Bot
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    defaultQueryTimeoutMs: 60 * 1000
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('QR Code Generated!');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('Sahan-X WhatsApp Bot Connected Successfully!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Message Handler
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || '';

    const sender = msg.key.remoteJid;
    const botName = "🤖 Sahan-X";

    // Commands Handle කිරීම
    if (text.toLowerCase() === '!ping') {
      await sock.sendMessage(sender, { 
        text: `${botName}: Pong! 🏓` 
      });
    }
    else if (text.toLowerCase() === '!help') {
      await sock.sendMessage(sender, { 
        text: `${botName} Commands:\n\n` +
              `!ping - Check bot status\n` +
              `!help - Show this menu\n` +
              `!owner - Bot owner info\n` +
              `Made with ❤️ by Sahan`
      });
    }
    else if (text.toLowerCase() === '!owner') {
      await sock.sendMessage(sender, { 
        text: `${botName}\nOwner: Sahan\n` +
              `This is a custom WhatsApp bot`
      });
    }
  });
}

connectToWhatsApp();
