const admin = require('firebase-admin');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const firebaseConfig = require('./environments/environments.js').firebaseConfig;
admin.initializeApp(firebaseConfig);

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const bucket = admin.storage().bucket();
    const { originalname, buffer } = req.file;

    const blob = bucket.file(originalname.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false
    });
    console.log("attempting to upload file")
    blobStream.on('finish', () => {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`;
      res.status(200).send({ fileName: originalname, fileLocation: publicUrl });
    });

    blobStream.end(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'An error occurred while uploading the file' });
  }
});

app.use(function(err, req, res, next) {
  console.error(err.stack); // Log error stack to console
  res.status(500).send('Something broke!');
});

app.listen(3000, () => console.log('Server started on port 3000'));