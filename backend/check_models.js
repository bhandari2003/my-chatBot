require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Checking available models...");

// Using built-in fetch (Node 18+)
fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }
    
    console.log("\n--- AVAILABLE MODELS ---");
    if (data.models) {
      data.models.forEach(model => {
        // We only care about models that can 'generateContent' (chat)
        if (model.supportedGenerationMethods.includes("generateContent")) {
          console.log(`Name: ${model.name.replace("models/", "")}`);
        }
      });
    } else {
      console.log("No models found. Check your API key permissions.");
    }
    console.log("------------------------");
  })
  .catch(err => console.error("Network Error:", err));