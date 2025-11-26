require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');

const storage = process.env.GCP_KEYFILE_PATH
  ? new Storage({ keyFilename: process.env.GCP_KEYFILE_PATH })
  : new Storage();

// Check and create uploads directory
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});

const upload = multer({ storage: multerStorage });

const app = express();
app.use(cors());

app.post('/upload', upload.single('file'), async (req, res) => {
  const bucketName = process.env.GCP_BUCKET || 'ebt_profilepics';
  const filename = req.file.path;
  const destination = path.join(bucketName, req.file.originalname);

  try {
    await storage.bucket(bucketName).upload(filename, {
      destination: destination,
      gzip: true,
      metadata: { cacheControl: 'no-cache' },
    });
  
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(req.file.originalname)}`;

    console.log(`${filename} uploaded to ${bucketName}.`);
    res.status(200).send(publicUrl);

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).send('Upload failed');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server started on port ${port}`));
