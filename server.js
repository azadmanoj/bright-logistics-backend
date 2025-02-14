const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create an instance of the express app
const app = express();

// Enable CORS for all requests (you can specify certain domains if needed)
app.use(cors());

// Use bodyParser to handle JSON requests
app.use(bodyParser.json());

// MSWIPE configuration (you can store this in an environment variable or a separate config file)
const MSWIPE_CONFIG = {
  AES_KEY: "cEHAzXt3uADsiPawZ78/Rw==",
  IV: "IFmkMH0LLw3NvR3H47yFKg==",
  CLIENT_ID: "MSW*PBLBri9401004085",
};

// Function to encrypt payload (this is a mock implementation, you can implement AES GCM encryption here)
const encryptPayload = (payload) => {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Function to decrypt response (mock implementation, you can implement AES GCM decryption here)
const decryptResponse = (encrypted) => {
  return JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'));
};

// Route to handle the request to generate an auth token
app.post('/generate-auth-token', async (req, res) => {
  try {
    const payload = {
      applId: "api",
      channelId: "pbl",
      clientId: MSWIPE_CONFIG.CLIENT_ID,
      password:
        "0376e5f81ed306a952d53c3caf3f6c14a1d7d69dd2a3b1b6d7b45f32138e086c",
      userId: "7880001415",
    };

    const encryptedData = encryptPayload(payload);

    const response = await axios.post(
      'https://dcuat.mswipetech.co.in/ipg/api/CreatePBLAuthEncToken',
      encryptedData,
      {
        headers: {
          'Content-Type': 'application/json',
          'client-id': MSWIPE_CONFIG.CLIENT_ID,
          'x-signature': 'aes',
        },
      }
    );
    console.log("🚀 ~ app.post ~ response:", response)

    const decryptedResponse = decryptResponse(response.data);
    return res.json({ token: decryptedResponse.token });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate auth token' });
  }
});

// Route to handle the creation of a payment link
app.post('/create-payment-link', async (req, res) => {
  try {
    const { amount, email, mobile } = req.body;

    const token = await generateAuthToken();

    const payload = {
      amount: amount,
      ApplicationId: "api",
      ChannelId: "pbl",
      ClientId: MSWIPE_CONFIG.CLIENT_ID,
      email_id: email,
      mobileno: mobile,
      IsSendSMS: true,
      request_id: `req_${Date.now()}`,
      sessiontoken: token,
      user_id: "7709282861",
      versionno: "VER4.0.0",
    };

    const encryptedData = encryptPayload(payload);

    const response = await axios.post(
      'https://dcuat.mswipetech.co.in/ipg/api/CreatePBLEncLink',
      encryptedData,
      {
        headers: {
          'Content-Type': 'application/json',
          'client-id': MSWIPE_CONFIG.CLIENT_ID,
          'x-signature': 'aes',
        },
      }
    );

    const decryptedResponse = decryptResponse(response.data);
    if (decryptedResponse.status === 'True') {
      return res.json({
        paymentLink: decryptedResponse.smslink,
        transactionId: decryptedResponse.txn_id,
      });
    } else {
      throw new Error(decryptedResponse.responsemessage || 'Failed to create payment link');
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create payment link' });
  }
});

// Start the server on port 5000
app.listen(5000, () => {
  console.log('Proxy server running on http://localhost:5000');
});
