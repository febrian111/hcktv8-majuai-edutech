import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const GEMINI_MODEL= "gemini-3.6-flash";

app.use(express.json());

const PORT=3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// Endpoint to generate text using the Gemini model
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    res.status(200).json({ result: response.text });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


// Endpoint to generate text from image using the Geminimi model
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
        model : GEMINI_MODEL,
        contents : [
            {text: prompt, type: "text"},
            {inlineData: {data: imageBase64, mimeType: req.file.mimeType}}
        ]
    });
    res.status(200).json({result: response.text})
} catch (err) {
console.log(err);
res.status(500).json({message: err.message});
}
});

// Endpoint to generate from document using the Gemini model
app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  try {

    const { prompt } =  req.body;
    const base64Document = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({ 
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: "text"},
        { inlineData: { data: base64Document, mimeType: req.file.mimeType } }
      ]
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const base64Audio = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buatkan transkrip dari rekaman berikut.", type: "text"},
        { inlineData: { data: base64Audio, type: req.file.mimeType }}
      ]
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});