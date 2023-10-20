const express = require('express');
const fs = require('fs');
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const port = 5001;
const host = '0.0.0.0'

// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up a storage engine for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '.png');
    },
});

// Create a multer instance with the storage configuration
const upload = multer({ storage: storage });

// a greet endpoint that returns hello to the requester
app.get('/greet', (req, res) => {
    console.log('Received a request from ' + req.connection.remoteAddress);
    res.status(200).json({ message: 'Hello' });
});


// Endpoint to handle the POST request
app.post('/tests', upload.single('image'), (req, res) => {
    // Retrieve query parameters
    const task = req.query.task;
    const port = req.query.port;
    const api = req.query.api;

    // Ensure the task is "detect"
    if (task == 'detection') {
        // Get the path to the image, which is "test_images/detect.png"
        const imagePath = path.join(__dirname, 'test_images', 'detect.png');
        const requesterIP = req.connection.remoteAddress; // Get the requester's IP

        // Create a readable stream for the image
        const imageStream = fs.createReadStream(imagePath);

        // Configure the HTTP POST request
        const requestOptions = {
            url: `http://${requesterIP}:${port}/${api}`, // Assuming you want to send it to the requester's IP on port 5000
            formData: {
                image: imageStream,
            },
        };

        // Send the HTTP POST request to the requester's IP with the image
        request.post(requestOptions, (error, response, body) => {
            if (error) {
                return res.status(500).json({ error: 'Failed to send the image to the requester' });
            }

            res.status(200).json({ message: 'Image sent to the requester' });
        });
    }
    else return res.status(400).json({ error: 'Invalid task specified' });
});

app.listen(port, host, () => {
    console.log(`Server is running on host ${host} port ${port}`);
});