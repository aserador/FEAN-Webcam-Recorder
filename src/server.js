const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('./environments/credentials.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fean-web-recorder-default-rtdb.firebaseio.com/',
  storageBucket: 'gs://fean-web-recorder.appspot.com'
});

const bucket = admin.storage().bucket();
const db = admin.database();

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // limit to 50MB
  },
});

app.post('/upload', upload.single('file'), (req, res) => {
  // TODO: Authenticate the user and get their ID - for now, use a sample user
  const userId = 'sampleUser';

  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  // Create a new blob in the bucket and upload the file data
  const blob = bucket.file(req.file.originalname.replace(/ /g, "_"));
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    res.status(500).send(err);
  });

  blobStream.on('finish', async () => {
    // The public URL can be used to directly access the file via HTTP
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

    // Save the data to the database under the specific user
    const ref = db.ref(`users/${userId}/videos`);
    await ref.push({ fileName: req.file.originalname, fileLocation: publicUrl });

    res.status(200).send({ fileName: req.file.originalname, fileLocation: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

app.use(cors({
  origin: 'http://localhost:4200' 
}));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});