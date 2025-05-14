import fs from "fs"
import path from "path"
import {fileTypeFromBuffer} from "file-type"
import Thread from "../models/thread.model.js"
const allowed_mimetype = ["image/jpeg", "image/png", "image/gif"]

/////////////// CREATE NEW THREAD ////////////////
export const createThread = async (req, res) => {
  try {
    const authorId = req.body.author
    const {content} = req.body
    const image = req.files?.image
    let imagePath = null

    if (!content) {
      return res
        .status(400)
        .json({success: false, message: "Content is required"})
    }

    // If there is an image file in the request
    if (image) {
      const imageFile = req.files.image
      const buffer = imageFile.data

      // File type detection based on magic number
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !allowed_mimetype.includes(type.mime)) {
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
    let pageNum = parseInt(page, 10)
    let limitNum = parseInt(limit, 10)

    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 10

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
      .skip((pageNum - 1) * limitNum)
      .limit(limit)

    return res.status(200).json({
      success: true,
      threads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// GET ALL THREADS ////////////////
export const getAllThreads = async (req, res) => {
  try {
    // Ambil query params untuk pagination
    let {page = "1", limit = "10"} = req.query
    let pageNum = parseInt(page, 10)
    let limitNum = parseInt(limit, 10)

    // Validasi page dan limit
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 10

    // Tanpa filter khusus, ambil semua threads
    const total = await Thread.countDocuments()
    const threads = await Thread.find()
      .sort({createdAt: -1})
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)

    return res.status(200).json({
      success: true,
      threads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// GET THREAD BY ID ////////////////
export const getThreadById = async (req, res) => {
  try {
    const {id} = req.params
    const thread = await Thread.findById(id)
    if (!thread) {
      return res.status(404).json({success: false, message: "Thread not found"})
    }
    return res.status(200).json({success: true, thread})
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// UPDATE THREAD ////////////////
export const updateThread = async (req, res) => {
  try {
    const {id} = req.params
    const {content} = req.body
    const image = req.files?.image

    const thread = await Thread.findById(id)
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "thread not found"
      })
    }
    if (thread.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({success: false, message: "Forbidden: not the author"})
    }

    let imagePath = thread.image
    const imageFile = req.files.image
    const buffer = imageFile.data
    if (image) {
      // Hapus gambar lama
      const oldImagePath = path.join(process.cwd(), "public", thread.image)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }

      // Upload gambar baru
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !allowed_mimetype.includes(type.mime)) {
        return res
          .status(400)
          .json({success: false, message: "Unsupported file type"})
      }
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      const fileName = `${Date.now()}_${image.name.replace(/\s/g, "_")}`
      const filePath = path.join(uploadDir, fileName)

      await image.mv(filePath)
      imagePath = `/uploads/${fileName}`
    }

    const updatedContent = {
      content: content || thread.content,
      image: imagePath
    }
    const updatedThread = await Thread.findByIdAndUpdate(id, updatedContent, {
      new: true,
      runValidators: true
    })

    await thread.save()
    return res
      .status(200)
      .json({success: true, message: "Thread updated", thread})
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// DELETE THREAD ////////////////
export const deleteThread = async (req, res) => {
  try {
    const {id} = req.params
    const thread = await Thread.findById(id)
    if (!thread) {
      return res.status(404).json({success: false, message: "Thread not found"})
    }
    // check the author
    if (thread.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({success: false, message: "Forbidden: not the author"})
    }

    // Delete image files
    const imagePath = path.join(process.cwd(), "public", thread.image)
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }

    // Delete thread document
    await thread.deleteOne()

    return res.status(200).json({success: true, message: "Thread deleted"})
  } catch (error) {
    console.error(error)
    return res.status(500).json({success: false, message: "Server error"})
  }
}
