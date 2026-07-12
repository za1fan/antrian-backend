const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://antrian-bongkar-buah-pks-bunut-default-rtdb.asia-southeast1.firebasedatabase.app'
});

app.get('/', (req, res) => {
  res.send('FCM backend aktif');
});

app.post('/send-to-worker', async (req, res) => {
  try {
    const { workerNo, title, body } = req.body;

    const db = getDatabase();
    const snapshot = await db.ref(`fcmTokens/${workerNo}`).get();

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Token pekerja tidak ditemukan' });
    }

    const tokenData = snapshot.val();
    const token = tokenData.token;

    if (!token) {
      return res.status(400).json({ error: 'Field token kosong / tidak valid' });
    }

    const message = {
      token,
      notification: {
        title: title || 'Notifikasi',
        body: body || 'Ada pembaruan antrean'
      },
      data: {
        workerNo: String(workerNo)
      }
    };

    const response = await getMessaging().send(message);

    res.json({
      success: true,
      messageId: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan di port ${PORT}`);
});