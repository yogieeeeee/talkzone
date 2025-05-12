import User from "../models/user.model.js"

/////////////// GET ALL USERS ////////////////
// with filter query and search user
export const getAllUsers = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build filter object
    const filter = {}
    const validRoles = ["admin", "author", "reader"]

    // Filter by role
    if (req.query.role) {
      if (!validRoles.includes(req.query.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role value"
        })
      }
      filter.role = req.query.role
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status === "true"
    }

    // Search user
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i")
      filter.$or = [
        {name: {$regex: searchRegex}},
        {email: {$regex: searchRegex}}
      ]
    }

    // Execution query with filter
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({createdAt: -1}).skip(skip).limit(limit).lean()
    ])

    // Format response
    const totalPages = Math.ceil(total / limit)
    const baseUrl = `${req.protocol}://${req.get("host")}`

    const formattedUsers = users.map(user => ({
      ...user,
      avatar: user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${baseUrl}${user.avatar}`
        : null // If avatar null
    }))
    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers: total,
        limit
      },
      appliedFilters: {
        role: req.query.role,
        status: req.query.status,
        searchTerm: req.query.search
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/////////////// GET USER BY ID ////////////////
export const getUserById = async (req, res) => {
  try {
    const {userId} = req.params
    const user = await User.findById(userId).lean()

    // User handle not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Format avatar URL
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const formattedUser = {
      ...user,
      avatar: user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${baseUrl}${user.avatar}`
        : null
    }

    res.status(200).json({
      success: true,
      data: formattedUser
    })
  } catch (error) {
    // Handle invalid ID format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/////////////// CHANGE USER STATUS ////////////////
export const changeUserStatus = async (req, res) => {
  try {
    const {userId} = req.params
    const {status} = req.body

    // Validate user status must be true/false
    if (typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be a boolean value (true/false)"
      })
    }

    // Find user and change status
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Prevent self-deactivation for admin
    if (user._id.toString() === req.user.id && !status) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account"
      })
    }

    user.status = status
    await user.save()

    // Format avatar URL
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const formattedUser = {
      ...user.toObject(),
      avatar: user.avatar
        ? user.avatar.startsWith("http")
          ? user.avatar
          : `${baseUrl}${user.avatar}`
        : null
    }

    res.status(200).json({
      success: true,
      message: "success to blocked user",
      data: formattedUser
    })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/////////////// CHANGE USER STATUS ////////////////
export const updateProfile = () => {}
