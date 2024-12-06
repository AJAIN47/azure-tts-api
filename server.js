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

// Voice Options
const voices = {
    "en-US": {
        "male": "en-US-GuyNeural",
        "female": "en-US-JennyNeural",
    },
    "es-ES": {
        "male": "es-ES-AlvaroNeural",
        "female": "es-ES-ElviraNeural",
    },
    // Add more languages and voices as needed
};

// Endpoint for Text-to-Speech
app.post('/api/tts', async (req, res) => {
    const { text, language, gender } = req.body;
    console.log(text, language, gender);
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    // Validate language and gender
    const voice = voices[language]?.[gender];
    if (!voice) {
        return res.status(400).json({ error: 'Invalid language or gender specified' });
    }
    try {
        const response = await axios.post(
            TTS_URL,
            `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='${language}'>
                <voice name='${voice}'>
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
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to convert text to speech' });
    }
});

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
