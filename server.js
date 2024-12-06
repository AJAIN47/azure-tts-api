const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Import the swagger configuration
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.json());  // Add this to parse JSON bodies
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/tts:
 *   post:
 *     summary: Convert text to speech
 *     description: Converts the given text into speech using Azure Text-to-Speech API.
 *     tags:
 *       - Text to Speech
 *     consumes:
 *       - application/json
 *     produces:
 *       - audio/wav
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         description: Input data for text-to-speech conversion.
 *         schema:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *               description: The text to convert to speech.
 *               example: "Hello, this is a text-to-speech conversion."
 *             language:
 *               type: string
 *               description: The language code for the text-to-speech conversion.
 *               example: "en-US"
 *             gender:
 *               type: string
 *               description: The gender of the voice.
 *               enum:
 *                 - male
 *                 - female
 *               example: "female"
 *     responses:
 *       200:
 *         description: Audio file created successfully. 
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Bad Request - Missing or invalid input parameters.
 *       500:
 *         description: Internal Server Error - Conversion failed due to server issues.
 */
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
