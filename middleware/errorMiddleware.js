// ============================================================
// ERROR MIDDLEWARE
// ============================================================

const errorMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  // Get status code
  const statusCode = res.statusCode === 200
    ? 500
    : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",

    // Show stack only during development
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.stack,
  });
};


// ============================================================
// NOT FOUND MIDDLEWARE
// ============================================================

const notFoundMiddleware = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};


export {
  errorMiddleware,
  notFoundMiddleware,
};

