const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors({
    origin: "https://crm-frontend-six-ashen.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// 🔐 BETTER SECRET (use env in real project)
const secretKey = "mysecret";

// DB CONNECT
mongoose.connect("mongodb+srv://bharathi:lEjyAHOSFpNsJRWv@cluster0.nrivkiq.mongodb.net/mini-crm?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

/* ---------------- MODELS ---------------- */

const User = mongoose.model("User", {
    email: String,
    password: String
});

const Lead = mongoose.model("Lead", {
    userId: String,
    name: String,
    email: String,
    phone: String,
    status: String
});

/* ---------------- AUTH MIDDLEWARE FIX ---------------- */

function check(req, res, next) {

    const header = req.headers.authorization;

    console.log("AUTH HEADER:", header); // 🔥 DEBUG

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No Token" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, secretKey);
        req.userId = decoded.id;
        next();

    } catch (err) {
        console.log("JWT ERROR:", err.message); // 🔥 DEBUG
        return res.status(401).json({ message: "Invalid Token" });
    }
}

/* ---------------- AUTH ROUTES ---------------- */

app.post("/register", async (req, res) => {
    let { email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
        return res.status(400).json({ message: "User Already Exists" });
    }

    let hash = await bcrypt.hash(password, 10);

    await User.create({ email, password: hash });

    res.json({ message: "Registered Successfully" });
});

app.post("/login", async (req, res) => {

    let { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    let ok = await bcrypt.compare(password, user.password);

    if (!ok) {
        return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, secretKey, {
        expiresIn: "7d"
    });

    res.json({ token });
});

/* ---------------- LEADS ---------------- */

app.get("/leads", check, async (req, res) => {
    let data = await Lead.find({ userId: req.userId });
    res.json(data);
});

app.post("/leads", check, async (req, res) => {

    const newLead = {
        userId: req.userId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        status: req.body.status
    };

    const lead = await Lead.create(newLead);
    res.json(lead);
});

app.put("/leads/:id", check, async (req, res) => {

    const updated = await Lead.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true }
    );

    if (!updated) {
        return res.status(404).json({ message: "Lead not found or unauthorized" });
    }

    res.json(updated);
});

app.delete("/leads/:id", check, async (req, res) => {

    await Lead.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });

    res.json({ message: "Deleted" });
});

/* ---------------- SERVER ---------------- */

app.listen(5000, () => {
    console.log("Server running 5000....");
});