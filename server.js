
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// app.use(express.static("Public"));

app.get("/", (req, res) => {
  res.send("Ask Gemini Backend is Running!");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Answer in only 2-3 lines using simple English. " + question
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data.error?.message || "";
      const lowerMessage = message.toLowerCase();


      
      if (
        response.status === 429 ||
        lowerMessage.includes("quota")
      ) {
        return res.status(429).json({
          error: "⚠️ API quota finished. Please try again later."
        });
      }

      return res.status(response.status).json({
        error: message || "Gemini API request failed."
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(502).json({
        error: "Gemini could not generate an answer."
      });
    }

    res.json({ answer });

  } catch (error) {
    console.log("Server Error:", error.message);

    res.status(500).json({
      error: "Server error. Please try again later."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
