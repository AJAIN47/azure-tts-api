const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
app.use(express.static('public'));

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_REGION = process.env.AZURE_REGION;
const TTS_URL = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

// Endpoint for Text-to-Speech
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const response = await axios.post(
            TTS_URL,
            `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
                <voice name='en-US-JennyNeural'>
                    ${text}
                </voice>
            </speak>`,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                },
                responseType: 'arraybuffer',
            }
        );

        res.set({
            'Content-Type': 'audio/wav',
            'Content-Length': response.data.length,
        });
        res.send(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error converting text to speech' });
    }
});

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
