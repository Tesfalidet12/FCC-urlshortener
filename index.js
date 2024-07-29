require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const { URL } = require("url");

const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortener");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
app.post("/api/shorturl", function (req, res) {
  const url = req.body.url;
  const parsedUrl = new URL(url);
  dns.lookup(parsedUrl.hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount,
      };
      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = parseInt(req.params.short_url);
  try {
    const urlDoc = await urls.findOne({ short_url: shorturl });

    if (urlDoc) {
      res.redirect(urlDoc.url);
    } else {
      res.status(404).send("No URL found for the given short URL.");
    }
  } catch (error) {
    console.error("Error finding the short URL:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
