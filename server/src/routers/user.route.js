import express from "express"
import {createThread, getMyThreads} from "../controllers/thread.controller.js"

// Middleware
import authMiddleware from "../middleware/auth.middleware.js"
import attachID from "../middleware/attachID.js"
import checkRole from "../middleware/checkRole.js"
import checkStatus from "../middleware/checkStatus.js"
const router = express.Router()

router.post(
  "/thread",
  authMiddleware,
  checkRole(["user"]),
  checkStatus,
  attachID("author"),
  createThread
)

router.get(
  "/thread/mine",
  authMiddleware,
  checkRole(["user"]),
  checkStatus,
  getMyThreads
)

export default router
