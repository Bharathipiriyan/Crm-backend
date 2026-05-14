const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const app = express()


app.use(cors())
app.use(express.json())


//dpconect
mongoose.connect("mongodb+srv://bharathi:lEjyAHOSFpNsJRWv@cluster0.nrivkiq.mongodb.net/mini-crm?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

///key
const secretKey = "mysecret"


//model
const User = mongoose.model("User", {
    email: String,
    password: String
})


//model
const Lead = mongoose.model("Lead", {
    userId: String,
    name: String,
    email: String,
    phone: String,
    status: String
})



function checkLogin(req, res, next) {
    let token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ message: "No Token" })
    }

    try {
        let data = jwt.verify(token, secretKey)
        req.userId = data.id
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" })
    }
}


//data receive register
app.post("/register", async (req, res) => {

    console.log("body:", req.body)

    let email = req.body.email
    let password = req.body.password
    let user = await User.findOne({ email })

    if (user) {
        return res.status(400).json({ message: "User Already Exists" })
    }
    //hash
    let hash = await bcrypt.hash(password, 10)

    await User.create({
        email: email,
        password: hash
    })

    res.json({ message: "Registered Successfully" })
});


///for login
app.post("/login", async (req, res) => {
    console.log(req.body.email, req.body.password)

    let email = req.body.email
    let password = req.body.password

    let user = await User.findOne({ email })

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    let ok = await bcrypt.compare(password, user.password)
    if (!ok) {
        return res.status(401).json({ message: "Wrong password" })
    }

    let token = jwt.sign({ id: user._id }, secretKey)

    res.json({ token })
})


//this for leads
app.get("/leads", checkLogin, async (req, res) => {
    let data = await Lead.find({
        userId: req.userId
    });
    res.json(data)
});



app.post("/leads", checkLogin, async (req, res) => {
    let newLead = {
        userId: req.userId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        status: req.body.status
    }
    let lead = await Lead.create(newLead)
    res.json(lead)
});



app.put("/leads/:id", checkLogin, async (req, res) => {
    let updated = await Lead.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.userId
        },
        req.body,
        { returnDocument: "after" }
    );
    res.json(updated)
});



app.delete("/leads/:id", checkLogin, async (req, res) => {
    await Lead.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    });
    res.json({ message: "Deleted" })
})


//port ruuning
app.listen(5000, () => {
    console.log("Server running 5000....")
})