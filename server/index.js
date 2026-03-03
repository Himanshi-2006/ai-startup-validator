const axios = require("axios");

const cors = require("cors");
app.use(cors());

const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("MySQL Connected Successfully ✅");
  }
});

app.get("/", (req, res) => {
  res.send("Server + Database working 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// const OpenAI = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });

// Create Idea
app.post("/ideas", async (req, res) => {

  const { title, description } = req.body;

  console.log("Incoming Data:", req.body);

  if (!title || !description) {
    return res.status(400).json({
      error: "Title and Description are required"
    });
  }

  try {

    // 🔥 AI Prompt
    const prompt = `
You are an expert startup consultant.

Analyze the startup idea below and return ONLY valid JSON with fields:
- problem
- customer
- market
- competitor (exactly 3 competitors with 1-line differentiation)
- tech_stack (4–6 realistic MVP technologies)
- risk_level (Low/Medium/High)
- profitability_score (integer 0–100)
- justification

Startup Idea:
Title: ${title}
Description: ${description}
`;

    // 🔥 Call OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiRaw = response.data.choices[0].message.content;

    // 🔥 Convert string → JSON
    const aiReport = JSON.parse(aiRaw);

    // 🔥 Save everything in DB
    const query = "INSERT INTO ideas (title, description, report) VALUES (?, ?, ?)";

    db.query(query, [title, description, JSON.stringify(aiReport)], (err, result) => {

      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        message: "Idea analyzed and saved ✅",
        ideaId: result.insertId,
        report: aiReport
      });

    });

  } catch (error) {
    console.error("AI Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "AI analysis failed"
    });
  }
});

// Get all ideas
app.get("/ideas/:id", (req, res) => {

  const ideaId = req.params.id;
  const query = "SELECT * FROM ideas WHERE id = ?";

  db.query(query, [ideaId], (err, results) => {

    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const idea = results[0];

    res.json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      report: JSON.parse(idea.report),
      created_at: idea.created_at
    });

  });

});

// Get single idea by ID
app.get("/ideas/:id", (req, res) => {

  const ideaId = req.params.id;

  const query = "SELECT * FROM ideas WHERE id = ?";

  db.query(query, [ideaId], (err, results) => {

    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: "Idea not found"
      });
    }

    res.json(results[0]);

  });

});

// Delete idea by ID
app.delete("/ideas/:id", (req, res) => {

  const ideaId = req.params.id;

  const query = "DELETE FROM ideas WHERE id = ?";

  db.query(query, [ideaId], (err, result) => {

    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({
        error: "Database error"
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Idea not found"
      });
    }

    res.json({
      message: "Idea deleted successfully ✅"
    });

  });

});