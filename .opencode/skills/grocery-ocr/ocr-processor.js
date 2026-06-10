#!/usr/bin/env node

/**
 * OCR Processor for Grocery Tickets
 * Extrae texto de imágenes de tickets usando OCR
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Procesa una imagen con OCR
 * @param {string} imagePath - Ruta a la imagen
 * @returns {Promise<string>} - Texto extraído
 */
async function processImageWithOCR(imagePath) {
  return new Promise((resolve, reject) => {
    // Verifica que la imagen existe
    if (!fs.existsSync(imagePath)) {
      reject(new Error(`Imagen no encontrada: ${imagePath}`));
      return;
    }

    // Usa tesseract si está disponible
    const tesseract = spawn('tesseract', [imagePath, 'stdout', '-l', 'spa']);

    let output = '';
    let error = '';

    tesseract.stdout.on('data', (data) => {
      output += data.toString();
    });

    tesseract.stderr.on('data', (data) => {
      error += data.toString();
    });

    tesseract.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`OCR falló: ${error}`));
      }
    });

    tesseract.on('error', (err) => {
      reject(new Error(`Error ejecutando tesseract: ${err.message}`));
    });
  });
}

/**
 * Procesa imagen con fallback a Vision API si tesseract no está disponible
 */
async function processImageWithVisionAPI(imagePath) {
  try {
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();

    const request = {
      image: { source: { filename: imagePath } },
    };

    const [result] = await client.textDetection(request);
    const detections = result.textAnnotations;

    if (detections && detections.length > 0) {
      return detections[0].description;
    }

    return '';
  } catch (error) {
    throw new Error(`Vision API no disponible: ${error.message}`);
  }
}

/**
 * Intenta OCR con múltiples métodos
 */
async function extractTextFromImage(imagePath) {
  try {
    // Intenta primero con tesseract (rápido y local)
    try {
      const text = await processImageWithOCR(imagePath);
      return {
        success: true,
        method: 'tesseract',
        text: text,
        confidence: 'alta'
      };
    } catch (tesseractError) {
      console.log('Tesseract no disponible, intentando Vision API...');
      
      // Intenta con Vision API como fallback
      try {
        const text = await processImageWithVisionAPI(imagePath);
        return {
          success: true,
          method: 'vision-api',
          text: text,
          confidence: 'alta'
        };
      } catch (visionError) {
        throw new Error(`No hay métodos de OCR disponibles. Error: ${visionError.message}`);
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      method: null
    };
  }
}

/**
 * Limpia el texto extraído
 */
function cleanText(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

// Exporta funciones
module.exports = {
  extractTextFromImage,
  processImageWithOCR,
  processImageWithVisionAPI,
  cleanText
};

// CLI
if (require.main === module) {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.error('Uso: ocr-processor.js <ruta-imagen>');
    process.exit(1);
  }

  extractTextFromImage(imagePath).then(result => {
    if (result.success) {
      console.log(JSON.stringify({
        success: true,
        method: result.method,
        text: cleanText(result.text),
        confidence: result.confidence
      }, null, 2));
    } else {
      console.error(JSON.stringify({
        success: false,
        error: result.error
      }, null, 2));
      process.exit(1);
    }
  }).catch(error => {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
    process.exit(1);
  });
}
