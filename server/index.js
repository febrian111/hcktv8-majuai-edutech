import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const GEMINI_MODEL= "gemini-3.5-flash-lite";

app.use(cors());
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

app.post("/api/chat", async (req, res) => {
  try {
    const { conversation } = req.body;

    if (!Array.isArray(conversation)) throw new Error("Message must be an Array!");

    const contents = conversation.map(({role, text}) => ({role, parts: [{text}]}));

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contents,
        config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            systemInstruction:`You are friendly AI grad - highschool that helps tudent to study and do their homework.
            Your job is not answer directly to their homework, but answer by guidens and explains the answer steps. 
            If the student is wrong, you correct them politely without exposing the answer directly.
            If the student asks for the answer directly, you politely refuse and explain the steps to find the answer.
            Keep your answer short and concise, no more than 2-3 sentences, but still educational.
            
            Don not answer any questions outside of grad school - highschool subjects.
            Answer in language of user.`, 

        }
    });
    
    res.status(200).json({ reply: response.text ?? "" });
} catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
}
});


// Test Endpoint
app.get("/", (req, res) => {
  res.send("<h1>Server berjalan normal!</h1><p>API untuk AI sudah aktif.</p>");
});