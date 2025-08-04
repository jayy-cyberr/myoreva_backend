const express = require("express")
const app = express()
const database = require("./config/connectToDB")
database()
const formRoute = require("./route/formRoute")
const twilioRoute = require("./route/twillioRoute")
const subscribeRoute = require("./route/subscribeRoute")

const cors = require('cors');






app.use(express.json())
app.use(cors());

const port = 6500

app.get("/health", (req, res) => {
    res.status(200).send(
        "Welcome to myoreva"
    )
    
});

app.use("/form", formRoute)
app.use("/message",twilioRoute)
app.use("/mail", subscribeRoute )


app.listen(port, () => {
    console.log(`Listening to ${port}`);
}
)