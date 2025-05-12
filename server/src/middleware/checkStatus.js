const checkStatus = (req, res, next) => {
  // Check if the "isActive" field exists in the authenticated user
  if (typeof req.user.status === "undefined") {
    console.error("Field status does not exist in user:", req.user)
    return res.status(500).json({
      success: false,
      message: "System configuration is not valid"
    })
  }

  // If the user is not active, send a forbidden response
  if (!req.user.status) {
    return res.status(403).json({
      success: false,
      message: "Your account is blocked by admin"
    })
  }

  // User is active, proceed to the next middleware or route handler
  next()
}

export default checkStatus
