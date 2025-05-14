import express from "express"
import {
  createThread,
  getMyThreads,
  getAllThreads,
  getThreadById,
  updateThread,
  deleteThread
} from "../controllers/thread.controller.js"

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
router.put(
  "/thread/:id/update",
  authMiddleware,
  checkRole(["user"]),
  checkStatus,
  updateThread
)
router.delete(
  "/thread/:id/delete",
  authMiddleware,
  checkRole(["user"]),
  checkStatus,
  deleteThread
)
router.get("/threads", getAllThreads)
router.get("/thread/:id", getThreadById)

export default router
