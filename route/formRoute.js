const mongoose = require("mongoose")
const express = require("express")
const {addForm} =  require("../controller/formController")

const formRoute = express.Router()

formRoute.post("/add", addForm)


module.exports = formRoute