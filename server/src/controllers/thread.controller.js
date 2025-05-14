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

    // Validate required content field
    if (!content) {
      return res
        .status(400)
        .json({success: false, message: "Content is required"})
    }

    // Handle image upload processing
    if (image) {
      const imageFile = req.files.image
      const buffer = imageFile.data

      // Magic number validation for image integrity
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !allowed_mimetype.includes(type.mime)) {
        return res
          .status(400)
          .json({success: false, message: "Unsupported file type"})
      }

      // Generate unique filename with timestamp
      const fileName = `thread-${Date.now()}.${type.ext}`
      const uploadDir = path.resolve("public", "uploads")

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {recursive: true})
      }

      imagePath = `/uploads/${fileName}`
      const fullPath = path.join(uploadDir, fileName)

      // Persist image to storage
      fs.writeFileSync(fullPath, buffer)
    }

    // Create database document
    const newThread = await Thread.create({
      content,
      image: imagePath,
      author: authorId
    })

    return res.status(201).json({
      success: true,
      message: "Thread created successfully",
      thread: newThread // Return created thread document
    })
  } catch (error) {
    console.error(error)
    // Generic server error response
    return res.status(500).json({success: false, message: "Server error"})
  }
}

/////////////// GET MY CREATED THREADS ////////////////
export const getMyThreads = async (req, res) => {
  try {
    const authorId = req.user.id // Authenticated user ID from middleware

    // Parse and validate pagination parameters
    let {page = 1, limit = 10, hasImage} = req.query
    let pageNum = parseInt(page, 10)
    let limitNum = parseInt(limit, 10)

    // Ensure valid numeric values for pagination
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 10

    // Base filter - always filter by authorized user
    const filter = {author: authorId}

    // Optional image presence filter
    if (hasImage === "true") {
      filter.image = {$ne: null} // Has non-null image
    } else if (hasImage === "false") {
      filter.image = null // Explicitly no image
    }

    // Get total count for pagination metadata
    const total = await Thread.countDocuments(filter)

    // Database query with sorting and pagination
    const threads = await Thread.find(filter)
      .sort({createdAt: -1}) // Newest first
      .skip((pageNum - 1) * limitNum) // Pagination offset
      .limit(limit) // Results per page

    return res.status(200).json({
      success: true,
      threads,
      pagination: {
        total, // Total matching documents
        page: pageNum, // Current page
        limit: limitNum, // Items per page
        totalPages: Math.ceil(total / limit) // Calculate total pages
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
    // Parse pagination parameters from query string
    let {page = "1", limit = "10"} = req.query
    let pageNum = parseInt(page, 10)
    let limitNum = parseInt(limit, 10)

    // Validate and sanitize pagination inputs
    if (Number.isNaN(pageNum) || pageNum < 1) pageNum = 1
    if (Number.isNaN(limitNum) || limitNum < 1) limitNum = 10

    // Get total thread count for pagination
    const total = await Thread.countDocuments() // No filter = count all documents

    // Retrieve paginated results with descending chronological order
    const threads = await Thread.find()
      .sort({createdAt: -1}) // Latest first
      .skip((pageNum - 1) * limitNum) // Calculate offset
      .limit(limitNum) // Apply page size

    return res.status(200).json({
      success: true,
      threads,
      pagination: {
        total, // Total available items
        page: pageNum, // Current page number
        limit: limitNum, // Items per page
        totalPages: Math.ceil(total / limitNum) // Calculate total pages
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
    // Extract thread ID from URL parameters
    const { id } = req.params;
    
    // Fetch thread with Mongoose ID lookup
    const thread = await Thread.findById(id);

    // Handle thread not found case
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found"
      });
    }

    // Return complete thread data
    return res.status(200).json({
      success: true,
      thread // Return full thread document
    });

  } catch (error) {
    // Log error details for debugging
    console.error("[Thread Fetch Error]", error);
    
    // Generic error response
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/////////////// UPDATE THREAD ////////////////
export const updateThread = async (req, res) => {
  try {
    const {id} = req.params
    const {content} = req.body
    const image = req.files?.image

    // Verify thread existence and ownership
    const thread = await Thread.findById(id)
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found"
      })
    }

    // Authorization check
    if (thread.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: not the author"
      })
    }

    let imagePath = thread.image

    // Handle image update if new image provided
    if (image) {
      const imageFile = req.files.image
      const buffer = imageFile.data

      // Clean up existing image file
      if (thread.image) {
        const oldImagePath = path.join(process.cwd(), "public", thread.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath) // Delete old file
        }
      }

      // Validate new image file type
      const type = await fileTypeFromBuffer(buffer)
      if (!type || !allowed_mimetype.includes(type.mime)) {
        return res.status(400).json({
          success: false,
          message: "Unsupported file type"
        })
      }

      // Generate unique filename
      const fileName = `${Date.now()}_${image.name.replace(/\s/g, "_")}`
      const uploadDir = path.join(process.cwd(), "public", "uploads")

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {recursive: true})
      }

      // Save new image
      const filePath = path.join(uploadDir, fileName)
      await image.mv(filePath)
      imagePath = `/uploads/${fileName}`
    }

    // Prepare update payload
    const updatedContent = {
      content: content || thread.content, // Preserve existing content if not provided
      image: imagePath
    }

    // Perform atomic update with validation
    const updatedThread = await Thread.findByIdAndUpdate(id, updatedContent, {
      new: true, // Return updated document
      runValidators: true // Ensure schema validation
    })

    return res.status(200).json({
      success: true,
      message: "Thread updated",
      thread: updatedThread // Return updated document
    })
  } catch (error) {
    console.error("[Update Error]", error)
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production" ? "Server error" : error.message
    })
  }
}

/////////////// DELETE THREAD ////////////////
export const deleteThread = async (req, res) => {
  try {
    // Extract thread ID from URL parameters
    const { id } = req.params;
    
    // Find thread document
    const thread = await Thread.findById(id);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found"
      });
    }

    // Authorization check - must be original author
    if (thread.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: not the author"
      });
    }

    // Clean up associated image file
    if (thread.image) {
      const imagePath = path.join(process.cwd(), "public", thread.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Permanently delete file
      }
    }

    // Remove document from database
    await thread.deleteOne(); // Prefer deleteOne() over remove() for better type checking

    return res.status(200).json({
      success: true,
      message: "Thread deleted"
    });

  } catch (error) {
    // Log detailed error for debugging
    console.error("[Delete Error]", error);
    
    // Secure error response
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? "Server error" 
        : error.message
    });
  }
};
