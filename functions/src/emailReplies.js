const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.handleEmailReply = functions.https.onRequest(async (req, res) => {
  // Verify the request is from your email service (you'll need to implement proper verification)
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { from, subject, text, html, date } = req.body;

    // Store the reply in Firestore
    await admin.firestore().collection('emailReplies').add({
      from,
      subject,
      message: text || html,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      receivedAt: date || new Date().toISOString()
    });

    // Send a success response
    res.status(200).send('Reply processed successfully');
  } catch (error) {
    console.error('Error processing email reply:', error);
    res.status(500).send('Error processing reply');
  }
}); 