const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'artifact-collection', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());

app.post('/analyze', upload.single('artifact'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
        if (!apiKey) return res.status(500).json({ error: 'Server API Key is missing.' });

        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

        const imageUrl = req.file.path; 

        const responseImage = await fetch(imageUrl);
        const buffer = await responseImage.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        const prompt = "Act as an expert museum curator. Identify this artifact's specific academic title. Format exactly as: Title: [Name] | Info: [4-5 sentences of context]";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
        ]);

        const response = await result.response;
        const text = response.text();
        
        let title = "Unidentified Artifact";
        let info = text;

        if (text.includes('|')) {
            const parts = text.split('|');
            title = parts[0].replace(/Title:/i, '').trim();
            info = parts[1].replace(/Info:/i, '').trim();
        }

        res.json({ title, info, imageUrl: imageUrl });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/gallery', async (req, res) => {
    try {
        const { resources } = await cloudinary.search
            .expression('folder:artifact-collection')
            .with_field('context')
            .execute();

        const galleryData = resources.map(file => ({
            title: file.context?.caption || "Unknown Artifact",
            info: file.context?.description || "No description available",
            imageUrl: file.secure_url
        }));

        res.json(galleryData);
    } catch (error) {
        console.error("Gallery fetch failed:", error);
        res.status(500).json({ error: "Could not load gallery" });
    }
});

app.listen(port, () => console.log(`🚀 Server running with Cloudinary at http://localhost:${port}`));