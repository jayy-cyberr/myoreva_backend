const express = require("express");
const app = express();
const database = require("./config/connectToDB");
const formRoute = require("./route/formRoute");
const subscribeRoute = require("./route/subscribeRoute");
const adminRoute = require("./route/adminRoute");
const authRoute = require("./route/authRoute");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
 

database();


app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));


app.use(cors({
    origin: ["https://myoreva.vercel.app", "http://127.0.0.1:5500/login.html", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use("/admin", express.static(path.join(__dirname, "public/admin")));
app.use('/images', express.static(path.join(__dirname, 'images')));


app.get("/health", (req, res) => {
    res.status(200).send("Welcome to myoreva");
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public/admin/index.html"));
});

app.use("/api/form", formRoute);
app.use("/api/mail", subscribeRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);


app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500", " http://127.0.0.1:5500/login.html", "http://localhost:5174");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    if (err.status === 413 || err.name === "PayloadTooLargeError") {
        res.status(413).json({ message: "Payload too large. Please use a smaller image or message." });
    } else {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

const port = 6500;
app.listen(port, () => {
    console.log(`Listening to ${port}`);
});
