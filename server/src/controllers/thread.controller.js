import fs from "fs"
import path from "path"
import {fileTypeFromBuffer} from "file-type"
import Thread from "../models/thread.model.js"

/////////////// CREATE NEW THREAD ////////////////
export const createThread = async (req, res) => {
  try {
    const authorId = req.body.author
    const {content} = req.body

    if (!content) {
      return res
        .status(400)
        .json({success: false, message: "Content is required"})
    }

    let imagePath = null

    // If there is an image file in the request
    if (req.files?.image) {
      const imageFile = req.files.image
      const buffer = imageFile.data

      // File type detection based on magic number
      const type = await fileTypeFromBuffer(buffer)
      if (
        !type ||
        !["image/jpeg", "image/png", "image/gif"].includes(type.mime)
      ) {
        return res
          .status(400)
          .json({success: false, message: "Unsupported file type"})
      }

      // Generate unique file names
      const fileName = `thread-${Date.now()}.${type.ext}`
      const uploadDir = path.resolve("public", "uploads")

      // Make sure the directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {recursive: true})
      }

      imagePath = `/uploads/${fileName}`
      const fullPath = path.join(uploadDir, fileName)

      // Save file to disk
      fs.writeFileSync(fullPath, buffer)
    }

    // Create a new document
    const newThread = await Thread.create({
      content,
      image: imagePath,
      author: authorId
    })

    return res.status(201).json({
      success: true,
      message: "Thread created successfully",
      thread: newThread
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// GET MY CREATED THREADS ////////////////
export const getMyThreads = async (req, res) => {
  try {
    const authorId = req.user.id

    // Get query params for pagination and filter
    let {page = 1, limit = 10, hasImage} = req.query
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)

    // Build a basic filter
    const filter = {author: authorId}

    // Filter based on image presence if param is given
    if (hasImage === "true") {
      filter.image = {$ne: null}
    } else if (hasImage === "false") {
      filter.image = null
    }

    // Count total documents according to filters
    const total = await Thread.countDocuments(filter)

    // Query with pagination
    const threads = await Thread.find(filter)
      .sort({createdAt: -1})
      .skip((page - 1) * limit)
      .limit(limit)

    return res.status(200).json({
      success: true,
      threads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// GET ALL THREADS ////////////////
export const getAllThreads = async (req, res) => {}

/////////////// GET THREAD BY ID ////////////////
export const getThreadById = async (req, res) => {}
