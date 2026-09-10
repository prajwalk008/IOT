import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running successfully ✅");
});

// Test route
app.post("/api/health", (req, res) => {
  console.log("Data received:", req.body);
  res.json({ message: "Data received successfully!", data: req.body });
});

app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));
