import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express';
import { protect } from "./middlewares/authmiddleware.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";


const app = express();

app.use(express.json())
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(clerkMiddleware())

app.get("/",(req,res)=>{
    res.send("server is live");
})

//Routes
app.use("/api/workspaces", protect, workspaceRouter)
app.use("/api/projects",protect, projectRouter)
app.use("/api/tasks",protect, taskRouter)


const PORT = process.env.PORT || 5000

app.listen(PORT,()=>{
    console.log(`Server is Running on ${PORT}`);
})