const express = require('express');
const { connectToMongoDB } = require('./connect');
const urlRoute = require('./routes/url');
const staticRoute = require('./routes/staticRouter');
const userRoute = require('./routes/user');
const URL = require('./models/url');
const app = express();
const port = 3001;

const urlRoute = require("./routes/url.js");
app.use("/url", urlRoute);

// const userRoute = require("./routes/user.js");
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/url", urlRoute);
app.use("/user", userRoute);
app.use("/", staticRoute);

app.get("/test", async (req, res) => {
  const allUrls = await URL.find({});
  return res.end(`
    <html>
    <head></head>
    <body>
    <ol>
    ${allUrls.map(url => `<li>${url.shortId} - ${url.redirectUrl} - ${url.visitHistory.length}</li>`).join('')}
    </ol>
    </body>
    </html>
  `);
});
connectToMongoDB('mongodb://localhost:27017/config')
  .then(() => {
    console.log('Connected to MongoDB successfully')
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
app.use("/url", urlRoute);
app.get('/:shortId', async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    { shortId },
    { $push: { visitHistory: { timestamp: Date.now(), }, }, }

  );
  if (!entry) {
    return res.status(404).send("Short URL not found");
  }
  res.redirect(entry.redirectUrl);
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});