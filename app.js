const express = require('express');
const axios = require('axios'); // Import Axios
const fs = require('fs');
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const multer = require('multer');


const app = express();
const port = 8001;
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
// example: http://localhost:8001/tests?task=detection&port=5000&api=detections
app.get('/tests', upload.single('image'), async (req, res) => {
    // Retrieve query parameters
    const task = req.query.task;
    const target_host = req.query.host;
    const port = req.query.port;
    const api = req.query.api;

    console.log('Received a request from ' + req.connection.remoteAddress);
    console.log('Task: ' + task);
    console.log('Host: ' + target_host);
    console.log('Port: ' + port);
    console.log('API: ' + api);

    // Ensure the task is "detect"
    if (task == 'detection' || task == 'segmentation') {
        // Get the path to the image, which is "test_images/detect.png"
        const imagePath = path.join(__dirname, 'test_images', 'detect.png');

        // Create a readable stream for the image
        // const imageStream = fs.createReadStream(imagePath);
        const imageStream = fs.readFileSync(imagePath);

        const serviceURL = `http://${target_host}:${port}/${api}`;

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }

        // use axios to post the form data to the serviceURL
        try {
            const formData = new FormData();
            formData.append('image', imageStream);

            console.log('imageStream: ' + imageStream);

            const response = await axios.post(serviceURL, formData, config);

            if (response.headers['content-type'] == 'image/png') {
                // get the image file
                const imageFile = Buffer.from(response.data, 'binary');
                // check if the image is valid
                if (imageFile.length == 0) {
                    console.log('Invalid image file size');
                    return res.status(400).json({ error: 'Invalid image file size' });
                }
                console.log('received image format: ' + response.headers['content-type'] + ', size: ' + imageFile.length);
                return res.status(200).json({ message: 'Image sent to the requester' });
            }
            else return res.status(400).json({ error: 'Invalid image format' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Internal Error, failed to send the image to the requester' });
        }
    }
    else if (task == 'inpainting') {
        // Get the path to images, which is "test_images/inpainting_image.png" and "test_images/inpainting_mask.png"
        const imagePath = path.join(__dirname, 'test_images', 'inpainting_image.png');
        const maskPath = path.join(__dirname, 'test_images', 'inpainting_mask.png');
        const requesterIP = req.connection.remoteAddress; // Get the requester's IP

        // Create a readable stream for the image
        const imageStream = fs.createReadStream(imagePath);
        const maskStream = fs.createReadStream(maskPath);

        // Configure the HTTP POST request
        const requestOptions = {
            url: `http://${requesterIP}:${port}/${api}`, // Assuming you want to send it to the requester's IP on port 5000
            formData: {
                image: imageStream,
                mask: maskStream,
            },
        };

        // Send the HTTP POST request to the requester's IP with the image
        request.post(requestOptions, (error, response, body) => {
            if (error) {
                return res.status(500).json({ error: 'Failed to send the image to the requester' });
            }

            // check the format of the response file
            // if the response is a image encoded in binary format, return true with code 200
            // else return false with code 400
            if (response.headers['content-type'] == 'image/png') {
                // get the image file
                const imageFile = Buffer.from(body, 'binary');
                // check if the image is valid
                if (imageFile.length == 0) {
                    console.log('Invalid image file size');
                    return res.status(400).json({ error: 'Invalid image file size' });
                }
                console.log('received image format: ' + response.headers['content-type'] + ', size: ' + imageFile.length);
                return res.status(200).json({ message: 'Image sent to the requester' });
            }
            else return res.status(400).json({ error: 'Invalid image format' });
        });
    }

    else return res.status(400).json({ error: 'Invalid task specified' });
});

app.listen(port, host, () => {
    console.log(`Server is running on host ${host} port ${port}`);
});