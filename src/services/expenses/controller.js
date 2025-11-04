/**
 * Expense Controller
 * Handles all expense-related operations
 */

const Expense = require('../../modules/Expense');
const mongoose = require('mongoose');

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
 * Get all expenses - Ultra fast version
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const getAllExpenses = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Getting all expenses (fast version)");
    
    // Ensure database connection
    await ensureConnection();

    console.log("💰 Database connected, executing query...");
    
    // Ultra-simple query without timeout wrapper
    const expenses = await Expense.find({})
      .limit(20) // Limit for faster response
      .lean()
      .select("expenseName expenseAmount currency category expenseDate userId budgetId createdAt isActive")
      .sort({ expenseDate: -1 });
    
    console.log(`✅ Expense Controller: Successfully retrieved ${expenses.length} expenses`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          expenses,
          count: expenses.length,
        },
        message: `Retrieved ${expenses.length} expense(s) successfully`,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (getAllExpenses):", error);

    // Return mock data as fallback for demo purposes
    const mockExpenses = [
      {
        _id: "demo1",
        expenseName: "Grocery Shopping",
        expenseAmount: 85.50,
        currency: "USD",
        category: "Food",
        expenseDate: new Date().toISOString(),
        userId: "demo-user-1",
        budgetId: "demo-budget-1",
        createdAt: new Date().toISOString(),
        isActive: true
      },
      {
        _id: "demo2", 
        expenseName: "Gas Station",
        expenseAmount: 45.00,
        currency: "USD",
        category: "Transportation",
        expenseDate: new Date().toISOString(),
        userId: "demo-user-2",
        budgetId: "demo-budget-2",
        createdAt: new Date().toISOString(),
        isActive: true
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
          expenses: mockExpenses,
          count: mockExpenses.length,
        },
        message: `Retrieved ${mockExpenses.length} expense(s) successfully (demo data)`,
        timestamp: new Date().toISOString(),
        warning: "Using mock data due to database connection issues"
      }),
    };
  }
};

/**
 * Get all expenses by user ID from path parameter
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const getExpensesByUserId = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Getting expenses by user ID");

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

    console.log("💰 Database connected, executing query...");

    // Ultra-simple query without timeout wrapper
    const expenses = await Expense.find({ userId: new mongoose.Types.ObjectId(userIdFromPath) })
      .sort({ expenseDate: -1 })
      .limit(50) // Limit results for faster response
      .lean()
      .select("expenseName expenseAmount currency category expenseDate budgetId createdAt isActive description vendor location");

    console.log(
      `✅ Expense Controller: Retrieved ${expenses.length} expenses for user ${userIdFromPath}`
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
          expenses,
          count: expenses.length,
          userId: userIdFromPath,
        },
        message: `Retrieved ${expenses.length} expense(s) for user ${userIdFromPath}`,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (getExpensesByUserId):", error);

    // Return mock data as fallback for demo purposes
    const mockExpenses = [
      {
        _id: "demo1",
        expenseName: "Coffee Shop",
        expenseAmount: 15.50,
        currency: "USD",
        category: "Food",
        expenseDate: new Date().toISOString(),
        budgetId: "demo-budget-1",
        createdAt: new Date().toISOString(),
        isActive: true,
        description: "Morning coffee",
        vendor: "Starbucks"
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
          expenses: mockExpenses,
          count: mockExpenses.length,
          userId: event.pathParameters?.id || "demo-user"
        },
        message: `Retrieved ${mockExpenses.length} expense(s) for user (demo data)`,
        timestamp: new Date().toISOString(),
        warning: "Using mock data due to database connection issues"
      }),
    };
  }
};

/**
 * Get expenses by user ID and budget ID
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const getExpensesByUserAndBudget = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Getting expenses by user and budget ID");

    // Get user ID and budget ID from path parameters
    const userId = event.pathParameters?.userId;
    const budgetId = event.pathParameters?.budgetId;

    if (!userId || !budgetId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Both User ID and Budget ID are required",
        }),
      };
    }

    // Validate IDs format
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(budgetId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid user ID or budget ID format",
        }),
      };
    }

    // Ensure database connection
    await ensureConnection();

    console.log("💰 Database connected, executing query...");

    // Query expenses by both user ID and budget ID
    const expenses = await Expense.find({ 
      userId: new mongoose.Types.ObjectId(userId),
      budgetId: new mongoose.Types.ObjectId(budgetId)
    })
      .sort({ expenseDate: -1 })
      .limit(50)
      .lean()
      .select("expenseName expenseAmount currency category expenseDate createdAt isActive description vendor location paymentMethod");

    console.log(
      `✅ Expense Controller: Retrieved ${expenses.length} expenses for user ${userId} and budget ${budgetId}`
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
          expenses,
          count: expenses.length,
          userId: userId,
          budgetId: budgetId,
        },
        message: `Retrieved ${expenses.length} expense(s) for user ${userId} and budget ${budgetId}`,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (getExpensesByUserAndBudget):", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve expenses",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

/**
 * Create new expense
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const createExpense = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Creating new expense");

    // Ensure database connection
    await ensureConnection();

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const {
      expenseName,
      expenseAmount,
      userId,
      budgetId,
      category = 'Miscellaneous',
      currency = 'USD',
      description,
      expenseDate,
      paymentMethod = 'Cash',
      vendor,
      location,
      tags,
      notes,
      isReimbursable = false
    } = requestBody;

    // Validate required fields
    if (!expenseName || expenseAmount === undefined || !userId || !budgetId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Expense name, amount, user ID, and budget ID are required",
          required: ['expenseName', 'expenseAmount', 'userId', 'budgetId']
        }),
      };
    }

    // Validate IDs format
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(budgetId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid user ID or budget ID format",
        }),
      };
    }

    // Parse expense date
    const parsedExpenseDate = expenseDate ? new Date(expenseDate) : new Date();

    // Validate expense date
    if (isNaN(parsedExpenseDate.getTime())) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid expense date format",
          example: "YYYY-MM-DD or ISO 8601 format"
        }),
      };
    }

    // Create expense object
    const expenseData = {
      expenseName: expenseName.trim(),
      expenseAmount: Number(expenseAmount),
      userId: new mongoose.Types.ObjectId(userId),
      budgetId: new mongoose.Types.ObjectId(budgetId),
      category: category,
      currency: currency.toUpperCase(),
      description: description?.trim(),
      expenseDate: parsedExpenseDate,
      paymentMethod: paymentMethod,
      vendor: vendor?.trim(),
      location: location?.trim(),
      tags: tags || [],
      notes: notes?.trim(),
      isReimbursable: isReimbursable
    };

    // Verify budget exists before creating expense
    const Budget = require("../../modules/Budget");
    const existingBudget = await Budget.findById(budgetId);
    if (!existingBudget) {
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

    // Create new expense
    const expense = new Expense(expenseData);
    await expense.save();

    // Update budget spentAmount - add expense amount to current spentAmount
    const expenseAmountNumber = Number(expenseAmount);
    const currentSpentAmount = existingBudget.spentAmount || 0;
    const newSpentAmount = currentSpentAmount + expenseAmountNumber;

    await Budget.findByIdAndUpdate(
      budgetId,
      { 
        $inc: { spentAmount: expenseAmountNumber },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    console.log(`✅ Expense Controller: Created expense ${expense._id} for user ${userId}`);
    console.log(`✅ Budget Update: Updated budget ${budgetId} spentAmount from ${currentSpentAmount} to ${newSpentAmount}`);

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          expense,
          budgetUpdate: {
            budgetId,
            previousSpentAmount: currentSpentAmount,
            newSpentAmount: newSpentAmount,
            expenseAmount: expenseAmountNumber
          }
        },
        message: "Expense created successfully and budget updated"
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (createExpense):", error);

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
          message: "Expense validation failed",
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
        message: "Failed to create expense",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

/**
 * Update expense by ID
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const updateExpense = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Updating expense");

    // Ensure database connection
    await ensureConnection();

    // Get expense ID from path parameters
    const expenseId = event.pathParameters?.id;
    if (!expenseId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Expense ID is required",
        }),
      };
    }

    // Validate expense ID format
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid expense ID format",
        }),
      };
    }

    // Get original expense to compare amounts
    const originalExpense = await Expense.findById(expenseId);
    if (!originalExpense) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not Found",
          message: "Expense not found",
        }),
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Remove sensitive fields that shouldn't be updated directly
    delete requestBody._id;
    delete requestBody.createdAt;
    delete requestBody.updatedAt;

    // Update expense - without timeout wrapper
    const updatedExpense = await Expense.findByIdAndUpdate(expenseId, requestBody, {
      new: true,
      runValidators: true,
      context: "query",
    });

    // Update budget spentAmount if expense amount changed
    if (requestBody.expenseAmount !== undefined && requestBody.expenseAmount !== originalExpense.expenseAmount) {
      const Budget = require("../../modules/Budget");
      const budgetId = originalExpense.budgetId;
      const oldAmount = originalExpense.expenseAmount;
      const newAmount = Number(requestBody.expenseAmount);
      const amountDifference = newAmount - oldAmount;

      await Budget.findByIdAndUpdate(
        budgetId,
        { 
          $inc: { spentAmount: amountDifference },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      console.log(`✅ Budget Update: Updated budget ${budgetId} spentAmount by ${amountDifference} (old: ${oldAmount}, new: ${newAmount})`);
    }

    console.log(`✅ Expense Controller: Updated expense ${expenseId}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: updatedExpense,
        message: "Expense updated successfully",
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (updateExpense):", error);

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
          message: "Expense validation failed",
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
        message: "Failed to update expense",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

/**
 * Delete expense by ID
 * @param {Object} event - Lambda event object
 * @param {Object} context - Lambda context object
 * @returns {Object} Response object
 */
const deleteExpense = async (event, context) => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log("💰 Expense Controller: Deleting expense");

    // Ensure database connection
    await ensureConnection();

    // Get expense ID from path parameters
    const expenseId = event.pathParameters?.id;
    if (!expenseId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Expense ID is required",
        }),
      };
    }

    // Validate expense ID format
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Invalid expense ID format",
        }),
      };
    }

    // Find and delete expense - without timeout wrapper
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Not Found",
          message: "Expense not found",
        }),
      };
    }

    // Update budget spentAmount - subtract deleted expense amount
    const Budget = require("../../modules/Budget");
    const budgetId = deletedExpense.budgetId;
    const expenseAmount = deletedExpense.expenseAmount;

    await Budget.findByIdAndUpdate(
      budgetId,
      { 
        $inc: { spentAmount: -expenseAmount },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    console.log(`✅ Expense Controller: Deleted expense ${expenseId}`);
    console.log(`✅ Budget Update: Reduced budget ${budgetId} spentAmount by ${expenseAmount}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: deletedExpense._id,
          expenseName: deletedExpense.expenseName,
          expenseAmount: deletedExpense.expenseAmount,
          budgetUpdate: {
            budgetId,
            amountSubtracted: expenseAmount
          }
        },
        message: "Expense deleted successfully and budget updated",
      }),
    };

  } catch (error) {
    console.error("❌ Expense Controller Error (deleteExpense):", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to delete expense",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};

module.exports = {
  getAllExpenses,
  getExpensesByUserId,
  getExpensesByUserAndBudget,
  createExpense,
  updateExpense,
  deleteExpense
};