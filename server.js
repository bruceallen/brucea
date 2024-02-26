require('dotenv').config();
const express = require('express');
const axios = require('axios'); 
const multer = require('multer');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Initialize S3 Client for AWS SDK v3
const s3Client = new S3Client({
    region: process.env.BUCKETEER_AWS_REGION,
    credentials: {
        accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY,
    },
});

// Ensure the uploads directory exists
const uploadsDirectory = path.join(__dirname, 'uploads2');
if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads2/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded.',
        });
    }

    const fileStream = fs.createReadStream(req.file.path);

    const uploadParams = {
        Bucket: process.env.BUCKETEER_BUCKET_NAME,
        Key: req.file.filename,
        Body: fileStream,
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        fs.unlinkSync(req.file.path); // Remove the file from local storage after upload

        const fileUrl = `https://${process.env.BUCKETEER_BUCKET_NAME}.s3.${process.env.BUCKETEER_AWS_REGION}.amazonaws.com/${req.file.filename}`;
        res.json({
            success: true,
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            data: data,
        });
    } catch (err) {
        console.error('Error uploading file:', err);
        fs.unlinkSync(req.file.path); // Attempt to clean up local file
        res.status(500).json({
            success: false,
            message: 'Failed to upload file.',
        });
    }
});

// Endpoint to generate a presigned URL for downloading files
app.get('/generate-presigned-url', async (req, res) => {
    const { fileName } = req.query;
    if (!fileName) {
        return res.status(400).json({
            success: false,
            message: 'File name is required.',
        });
    }

    const command = new GetObjectCommand({
        Bucket: process.env.BUCKETEER_BUCKET_NAME,
        Key: fileName,
    });

    try {
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
        res.json({
            success: true,
            presignedUrl: presignedUrl,
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned URL.',
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Proxy endpoint
app.post('/proxy-prompt', async (req, res) => {
    const externalApiUrl = 'http://134.215.109.213:44363/prompt';
  
    try {
      // Forward the request to the external API
      const response = await axios.post(externalApiUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          // Include other necessary headers here
        },
      });
  
      // Send the response from the external API back to the client
      res.json(response.data);
    } catch (error) {
      // Handle errors from the external API
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        res.status(error.response.status).json(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
        res.status(500).json({ message: 'No response received from external API' });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
        res.status(500).json({ message: error.message });
      }
    }
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});