const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    info: {
      title: 'Azure Text-to-Speech API',
      version: '1.0.0',
      description: 'A simple API to convert text to speech using Azure TTS service',
    },
    servers: [
      {
          url: `http://107.170.77.200:3005`,
      },
  ],
  },
  apis: ['./server.js'], // Path to the API documentation
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
