const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Storage Setup (Added webp support)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'artifact-collection',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], 
    },
});

const upload = multer({ storage: storage });

// 3. Gemini Configuration (Using the ultra-fast Flash model)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));
app.use(express.json());

// 4. The Analyze Route
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const imageUrl = req.file.path;
        const publicId = req.file.filename; // Cloudinary's identifier for the image

        // Initialize Gemini 1.5 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Analyze this artifact. Provide a short Title and a brief detailed description. Format: Title: [Name] | Info: [Description]";

        // Fetch image and convert to base64 for Gemini
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: Buffer.from(imageBuffer).toString('base64'),
                    mimeType: req.file.mimetype
                }
            }
        ]);

        const text = result.response.text();
        
        // Parse results
        let title = "Unidentified Artifact";
        let info = text;

        if (text.includes('|')) {
            const parts = text.split('|');
            title = parts[0].replace(/Title:/i, '').trim();
            info = parts[1].replace(/Info:/i, '').trim();
        }

        // --- BACKUP DATA TO CLOUDINARY ---
        // This saves the AI text inside your Cloudinary account forever
        try {
            await cloudinary.uploader.explicit(publicId, {
                type: "upload",
                context: {
                    caption: title,
                    description: info
                }
            });
            console.log("Metadata backed up to Cloudinary.");
        } catch (metaErr) {
            console.error("Metadata backup failed (non-critical):", metaErr);
        }

        // Send response back to user
        res.json({ title, info, imageUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.listen(port, () => {
    console.log(`Artifact AI running at http://localhost:${port}`);
});