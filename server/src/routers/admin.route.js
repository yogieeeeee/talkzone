import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import checkRole from "../middleware/checkRole.js"

import {
  getAllUsers,
  getUserById,
  changeUserStatus
} from "../controllers/user.controller.js"
const router = express.Router()

router.get("/users", authMiddleware, checkRole("admin"), getAllUsers)
router.get("/users/:userId", authMiddleware, checkRole("admin"), getUserById)
router.put(
  "/users/:userId/status",
  authMiddleware,
  checkRole("admin"),
  changeUserStatus
)

export default router
