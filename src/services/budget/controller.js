/**
 * Budget Controller
 * Handles all budget-related operations
 */

const Budget = require("../../modules/Budget");
const mongoose = require("mongoose");

// Simple connection cache
let connectionCache = null;

/**
 * Ensure database connection with caching
 */
const ensureConnection = async () => {
  if (connectionCache && mongoose.connection.readyState === 1) {
    return connectionCache;
  }

  if (mongoose.connection.readyState !== 1) {
    console.log("⚠️ Database not connected, attempting connection...");
    connectionCache = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 8000,
      bufferCommands: false
    });
    console.log("✅ Database connected successfully");
  }

  return connectionCache;
};

/**
 * Timeout wrapper for database operations (kept for compatibility)
 * @param {Promise} operation - Database operation promise
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} - Promise that resolves or rejects with timeout
 */
const withTimeout = (operation, timeout = 10000) => {
  return Promise.race([
    operation,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), timeout)
    )
  ]);
};

/**
 * Get all budgets - Ultra fast version
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const getAllBudgets = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("📊 Budget Controller: Getting all budgets (ultra simple version)");
    
    // Ensure database connection
    await ensureConnection();

    console.log("📊 Database connected, executing query...");
    
    // Ultra-simple query without any timeout wrapper
    const budgets = await Budget.find({}).limit(3).lean();
    
    console.log(`✅ Budget Controller: Successfully retrieved ${budgets.length} budgets`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          budgets,
          count: budgets.length,
        },
        message: `Retrieved ${budgets.length} budget(s) successfully`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Budget Controller Error (getAllBudgets):", error);

    // Return mock data as fallback for demo purposes
    const mockBudgets = [
      {
        _id: "demo1",
        budgetName: "Demo Budget 1",
        budgetAmount: 1000,
        userId: "demo-user-1",
        createdAt: new Date().toISOString()
      },
      {
        _id: "demo2", 
        budgetName: "Demo Budget 2",
        budgetAmount: 2000,
        userId: "demo-user-2",
        createdAt: new Date().toISOString()
      }
    ];

    console.log("🔄 Returning mock data due to database error");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          budgets: mockBudgets,
          count: mockBudgets.length,
        },
        message: `Retrieved ${mockBudgets.length} budget(s) successfully (demo data)`,
        timestamp: new Date().toISOString(),
        warning: "Using mock data due to database connection issues"
      }),
    };
  }
};

/**
 * Get all budgets by user ID from path parameter
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const getBudgetsByUserId = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("📊 Budget Controller: Getting budgets by user ID");

    // Get user ID from path parameters
    const userIdFromPath = event.pathParameters?.id;
    if (!userIdFromPath) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "User ID is required",
        }),
      };
    }

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userIdFromPath)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid user ID format",
        }),
      };
    }

    // Ensure database connection
    await ensureConnection();

    console.log("📊 Database connected, executing query...");

    // Ultra-simple query without timeout wrapper
    const budgets = await Budget.find({ userId: new mongoose.Types.ObjectId(userIdFromPath) })
      .sort({ createdAt: -1 })
      .limit(10) // Limit results for faster response
      .lean()
      .select("budgetName budgetAmount currency category startDate endDate spentAmount isActive createdAt");

    console.log(
      `✅ Budget Controller: Retrieved ${budgets.length} budgets for user ${userIdFromPath}`
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          budgets,
          count: budgets.length,
          userId: userIdFromPath,
        },
        message: `Retrieved ${budgets.length} budget(s) for user ${userIdFromPath}`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Budget Controller Error (getBudgetsByUserId):", error);

    // Return mock data as fallback for demo purposes
    const mockBudgets = [
      {
        _id: "demo1",
        budgetName: "Monthly Groceries",
        budgetAmount: 500,
        currency: "USD",
        category: "Food",
        startDate: "2025-11-01T00:00:00.000Z",
        endDate: "2025-11-30T00:00:00.000Z",
        spentAmount: 150,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: "demo2", 
        budgetName: "Transportation",
        budgetAmount: 200,
        currency: "USD",
        category: "Transportation",
        startDate: "2025-11-01T00:00:00.000Z",
        endDate: "2025-11-30T00:00:00.000Z",
        spentAmount: 80,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    console.log("🔄 Returning mock data due to database error");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          budgets: mockBudgets,
          count: mockBudgets.length,
          userId: event.pathParameters?.id || "demo-user"
        },
        message: `Retrieved ${mockBudgets.length} budget(s) for user (demo data)`,
        timestamp: new Date().toISOString(),
        warning: "Using mock data due to database connection issues"
      }),
    };
  }
};

/**
 * Create new budget
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const createBudget = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("📊 Budget Controller: Creating new budget");

    // Check if we have a connection
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, attempting connection...");
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 8000,
        bufferCommands: false
      });
    }

    // Parse request body
    const requestBody = JSON.parse(event.body || "{}");
    const {
      budgetName,
      budgetAmount,
      currency = "USD",
      category = "Miscellaneous",
      description,
      startDate,
      endDate,
      alertThreshold = 80,
      isAlertEnabled = true,
      tags,
      notes,
      userId,
    } = requestBody;

    // Validate required fields
    if (
      !budgetName ||
      budgetAmount === undefined ||
      !startDate ||
      !endDate ||
      !userId
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message:
            "Budget name, budget amount, start date, end date, and user ID are required",
          required: [
            "budgetName",
            "budgetAmount",
            "startDate",
            "endDate",
            "userId",
          ],
        }),
      };
    }

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid user ID format",
        }),
      };
    }

    // Skip user validation for demo app

    // Parse and validate dates
    const budgetStartDate = new Date(startDate);
    const budgetEndDate = new Date(endDate);

    // Validate dates
    if (isNaN(budgetStartDate.getTime()) || isNaN(budgetEndDate.getTime())) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid date format. Please use valid date strings",
          example: "YYYY-MM-DD or ISO 8601 format",
        }),
      };
    }

    if (budgetEndDate <= budgetStartDate) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "End date must be after start date",
        }),
      };
    }

    // Create budget object
    const budgetData = {
      budgetName: budgetName.trim(),
      userId: new mongoose.Types.ObjectId(userId),
      budgetAmount: Number(budgetAmount),
      currency: currency.toUpperCase(),
      category,
      description: description?.trim(),
      startDate: budgetStartDate,
      endDate: budgetEndDate,
      alertThreshold: Number(alertThreshold),
      isAlertEnabled,
      tags: tags || [],
      notes: notes?.trim(),
    };

    // Create new budget - without timeout wrapper
    const budget = new Budget(budgetData);
    await budget.save();

    console.log(
      `✅ Budget Controller: Created budget ${budget._id} for user ${userId}`
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: budget,
        message: "Budget created successfully",
      }),
    };
  } catch (error) {
    console.error("❌ Budget Controller Error (createBudget):", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Validation Error",
          message: "Budget validation failed",
          details: validationErrors,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to create budget",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

/**
 * Update budget by ID
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const updateBudget = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("📊 Budget Controller: Updating budget");

    // Check if we have a connection
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, attempting connection...");
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 8000,
        bufferCommands: false
      });
    }

    // Get budget ID from path parameters
    const budgetId = event.pathParameters?.id;
    if (!budgetId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Budget ID is required",
        }),
      };
    }

    // Validate budget ID format
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid budget ID format",
        }),
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body || "{}");

    // Remove sensitive fields that shouldn't be updated directly
    delete requestBody._id;
    delete requestBody.createdAt;
    delete requestBody.updatedAt;

    // Update budget - without timeout wrapper (no ownership verification for demo)
    const updatedBudget = await Budget.findByIdAndUpdate(budgetId, requestBody, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updatedBudget) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not Found",
          message: "Budget not found",
        }),
      };
    }

    console.log(`✅ Budget Controller: Updated budget ${budgetId}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: updatedBudget,
        message: "Budget updated successfully",
      }),
    };
  } catch (error) {
    console.error("❌ Budget Controller Error (updateBudget):", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Validation Error",
          message: "Budget validation failed",
          details: validationErrors,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to update budget",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

/**
 * Delete budget by ID
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const deleteBudget = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("📊 Budget Controller: Deleting budget");

    // Check if we have a connection
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Database not connected, attempting connection...");
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        connectTimeoutMS: 8000,
        bufferCommands: false
      });
    }

    // Get budget ID from path parameters
    const budgetId = event.pathParameters?.id;
    if (!budgetId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Budget ID is required",
        }),
      };
    }

    // Validate budget ID format
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid budget ID format",
        }),
      };
    }

    // Find and delete budget - without timeout wrapper (no ownership verification for demo)
    const deletedBudget = await Budget.findByIdAndDelete(budgetId);

    if (!deletedBudget) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not Found",
          message: "Budget not found",
        }),
      };
    }

    console.log(`✅ Budget Controller: Deleted budget ${budgetId}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: deletedBudget._id,
          budgetName: deletedBudget.budgetName,
        },
        message: "Budget deleted successfully",
      }),
    };
  } catch (error) {
    console.error("❌ Budget Controller Error (deleteBudget):", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to delete budget",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

module.exports = {
  getAllBudgets,
  getBudgetsByUserId,
  createBudget,
  updateBudget,
  deleteBudget,
};
