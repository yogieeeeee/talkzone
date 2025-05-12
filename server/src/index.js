import express from "express"
import upload from "express-fileupload"
import connectDB from "./config/db.js"
import fileUpload from "express-fileupload"

// Setup
import createAdmin from "./setup/createAdmin.js"
// Routes
import authRoute from "./routers/auth.route.js"
import adminRoute from "./routers/admin.route.js"
import userRoute from "./routers/user.route.js"
const app = express()

connectDB()
createAdmin()
app.use(express.json())

app.use(
  fileUpload({
    limits: {fileSize: 5 * 1024 * 1024}, // size 5MB
    abortOnLimit: true
  })
)

app.use("/api/auth", authRoute)
app.use("/api/admin", adminRoute)
app.use("/api/user", userRoute)

app.listen(5000, () => {
  console.log("server is running on port 5000")
})
