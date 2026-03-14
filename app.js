const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require("@google/genai");

const app = express();
const port = process.env.PORT || 3000;

// Use Environment Variable for Security
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI(apiKey);

// Ensure uploads folder exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, 'art-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

app.post('/analyze', upload.single('artifact'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file.' });
        if (!apiKey) return res.status(500).json({ error: 'API Key missing on server.' });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageData = fs.readFileSync(req.file.path).toString("base64");

        const prompt = "Act as an expert museum curator and historian. Identify this artifact's specific academic or museum title. Format exactly as: Title: [Academic Name] | Info: [4-5 sentence historical context]";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: req.file.mimetype } }
        ]);

        const text = result.response.text();
        let title = "Unidentified Artifact", info = text;

        if (text.includes('|')) {
            const parts = text.split('|');
            title = parts[0].replace(/Title:/i, '').trim();
            info = parts[1].replace(/Info:/i, '').trim();
        }

        res.json({ title, info, imageUrl: `/uploads/${req.file.filename}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => console.log(`🚀 Server: http://localhost:${port}`));