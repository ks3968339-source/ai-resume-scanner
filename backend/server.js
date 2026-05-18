const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed!'), false);
    }
});

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });
        if (!req.body.jobDescription) return res.status(400).json({ error: 'Job description is required.' });

        // Bulletproof PDF extraction - handles all Render environment quirks
        let pdfData;
        if (typeof pdfParse === 'function') {
            pdfData = await pdfParse(req.file.buffer);
        } else if (pdfParse.default && typeof pdfParse.default === 'function') {
            pdfData = await pdfParse.default(req.file.buffer);
        } else if (pdfParse.PDFParse) {
            pdfData = await new pdfParse.PDFParse(req.file.buffer);
        } else {
            throw new Error('PDF library failed to load. Keys: ' + Object.keys(pdfParse).join(', '));
        }

        const extractedText = pdfData.text;
        if (!extractedText || extractedText.trim().length < 10) {
            return res.status(400).json({ error: 'Could not extract text from PDF. Please make sure it is a text-based PDF (not a scanned image).' });
        }

        const jobDescription = req.body.jobDescription;

        const prompt = `
            You are an expert ATS (Applicant Tracking System) and Senior Tech Recruiter.
            Analyze the following Resume against the provided Job Description.
            
            Return ONLY a valid raw JSON object with no markdown formatting.
            
            The JSON structure MUST exactly match this:
            {
              "score": <number from 0-100 indicating how well the resume matches the job>,
              "matchedTechnologies": [<array of strings of found skills>],
              "missingTechnologies": [<array of strings of missing skills>],
              "actionableAdvice": [<array of exactly 3 strings with specific advice to improve>]
            }

            Job Description:
            ${jobDescription}

            Resume Text:
            ${extractedText}
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json", 
            }
        });

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Strip any accidental markdown wrappers
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const aiAnalysis = JSON.parse(responseText);
        res.json(aiAnalysis);

    } catch (error) {
        console.error("Backend Crash Error:", error);
        res.status(500).json({ error: `Crash Reason: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
