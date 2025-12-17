require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Auto-create uploads folder
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use this exact string. It is the most stable and has the highest free limits.
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-001", 
  systemInstruction: "You are a direct and concise assistant. Give extremely brief answers." 
});

let chatHistory = []; 

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

app.post('/chat', upload.single('file'), async (req, res) => {
  try {
    const userMessage = req.body.message;
    const file = req.file;

    if (userMessage) {
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    }

    let promptParts = [...chatHistory.flatMap(m => m.parts)]; 
    
    if (file) {
        const mimeType = file.mimetype;
        const imagePart = fileToGenerativePart(file.path, mimeType);
        promptParts.push(imagePart);
        chatHistory.push({ role: "user", parts: [{ text: `[User uploaded file: ${file.originalname}]` }] });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();

    chatHistory.push({ role: "model", parts: [{ text: text }] });

    if (file) fs.unlinkSync(file.path); 

    res.json({ reply: text, history: chatHistory });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.post('/reset', (req, res) => {
  chatHistory = []; 
  console.log("Chat history cleared.");
  res.json({ message: "Chat history cleared" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});