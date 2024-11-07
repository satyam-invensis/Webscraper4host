import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import cors from 'cors';
import { Parser } from 'json2csv';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to get directory name from ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the upload directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Storage configuration for multer (handling file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Function to call the new RapidAPI for summarization
async function callNewRapidAPI(prompt) {
  const options = {
    method: "POST",
    url: `https://${process.env.RAPIDAPI_HOST}/v1/chat/completions`, // Use environment variables for the URL and host
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY, // API Key from .env file
      'x-rapidapi-host': process.env.RAPIDAPI_HOST, // Host from .env file
      "Content-Type": "application/json",
    },
    data: {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    },
  };

  const response = await axios.request(options);
  return response.data;
}

// Function to sleep for a given time (from `text.js`)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to search using Google Custom Search
async function searchGoogleCustomSearch(topic, numPages) {
  const apiKey = process.env.GOOGLE_API_KEY; // Use environment variables for API key
  const searchEngineId = process.env.SEARCH_ENGINE_ID; // Use environment variables for search engine ID

  if (!topic || topic.trim() === "") {
    throw new Error("Search topic cannot be empty.");
  }

  const results = [];
  const requestsNeeded = Math.ceil(numPages / 10);

  for (let i = 0; i < requestsNeeded; i++) {
    const currentNum = Math.min(10, numPages - i * 10);
    let retries = 0;

    while (retries < 5) {
      try {
        const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
          params: {
            key: apiKey,
            cx: searchEngineId,
            q: topic,
            num: currentNum,
            start: i * 10 + 1, // Google API requires start to be 1-based
          },
        });

        const searchResults = response.data.items || [];
        if (searchResults.length > 0) {
          const articles = searchResults.map((item) => ({
            Title: item.title,
            Content: item.snippet,
            Source: item.link,
          }));
          results.push(...articles);
        }

        // Sleep to avoid hitting API rate limits
        await sleep(2000);
        break; // Exit the retry loop on success
      } catch (error) {
        console.error("API Error:", error);
        if (error.response && error.response.status === 429) {
          await sleep(5000); // Rate limit exceeded
          retries++;
        } else {
          throw error;
        }
      }
    }
  }

  if (results.length === 0) {
    throw new Error("No articles found.");
  }

  return results;
}

// Route to download the CSV file
app.get("/download-csv", (req, res) => {
  const filePath = path.join(__dirname, "ai_customs_brokerage_articles.csv");
  res.download(filePath, "ai_customs_brokerage_articles.csv", (err) => {
    if (err) {
      res.status(500).send("Error sending file.");
    }
  });
});

// Search endpoint
app.post("/search", async (req, res) => {
  try {
    const { topic, numPages, pageCap } = req.body;
    const articles = await searchGoogleCustomSearch(topic, numPages);
    if (!articles) {
      return res.status(404).send("No articles found.");
    }

    const cappedArticles = articles.map((article) => ({
      ...article,
      Content: article.Content.length > pageCap ? article.Content.slice(0, pageCap) + "..." : article.Content,
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(cappedArticles);
    fs.writeFileSync("ai_customs_brokerage_articles.csv", csv);

    return res.status(200).json(cappedArticles);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

// File upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      const command = req.body.command; // Get the user command
      const prompt = `Based on the following data: ${JSON.stringify(results)}, ${command}`;

      try {
        const output = await callNewRapidAPI(prompt);
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
        res.status(200).json({ output: output.choices[0].message.content });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to get response from the API." });
      }
    })
    .on("error", (error) => {
      console.error("Error reading CSV file:", error);
      res.status(500).json({ error: "Failed to process the file." });
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
