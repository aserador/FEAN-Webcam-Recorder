const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('./environments/credentials.json');

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

  const blob = bucket.file(req.file.originalname.replace(/ /g, "_"));
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    res.status(500).send(err);
  });

  blobStream.on('finish', async () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

    const ref = db.ref(`users/${userId}/videos`);
    await ref.push({ fileName: req.file.originalname, fileLocation: publicUrl });

    res.status(200).send({ fileName: req.file.originalname, fileLocation: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

app.get('/videos', async (req, res) => {
  // TODO: Authenticate the user and get their ID - for now, use a sample user
  const userId = 'sampleUser';

  const ref = db.ref(`users/${userId}/videos`);
  ref.once('value', async (snapshot) => {
    const videos = snapshot.val();

    const promises = Object.keys(videos).map(async key => {
      const video = videos[key];
      const file = bucket.file(video.fileName.replace(/ /g, "_"));

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-17-2025'
      });

      return {
        id: key,
        fileName: video.fileName,
        fileLocation: url
      };
    });

    const videoArray = await Promise.all(promises);

    console.log('Video array:', videoArray);
    res.json(videoArray);
  }, (error) => {
    console.error(error);
    res.status(500).send(error);
  });
});

app.use(cors({
  origin: 'http://localhost:4200' 
}));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});