/**
 * Expense Model
 * MongoDB schema for expense data with comprehensive validation
 */

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseName: {
    type: String,
    required: [true, 'Expense name is required'],
    trim: true,
    maxlength: [100, 'Expense name cannot exceed 100 characters'],
    minlength: [2, 'Expense name must be at least 2 characters long']
  },

  expenseAmount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Expense amount must be greater than 0'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Expense amount must be a valid positive number'
    }
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: [true, 'Budget ID is required'],
    index: true
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Food', 'Transportation', 'Entertainment', 'Shopping', 
        'Bills', 'Healthcare', 'Education', 'Travel', 
        'Groceries', 'Utilities', 'Insurance', 'Miscellaneous'
      ],
      message: 'Category must be one of the predefined values'
    },
    default: 'Miscellaneous'
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    enum: {
      values: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'LKR'],
      message: 'Currency must be a valid currency code'
    },
    default: 'USD'
  },

  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },

  paymentMethod: {
    type: String,
    enum: {
      values: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Check', 'Other'],
      message: 'Payment method must be one of the predefined values'
    },
    default: 'Cash'
  },

  receiptUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Receipt URL must be a valid URL'
    }
  },

  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  isRecurring: {
    type: Boolean,
    default: false
  },

  recurringFrequency: {
    type: String,
    enum: {
      values: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      message: 'Recurring frequency must be one of: Daily, Weekly, Monthly, Yearly'
    },
    required: function() {
      return this.isRecurring;
    }
  },

  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },

  vendor: {
    type: String,
    trim: true,
    maxlength: [100, 'Vendor name cannot exceed 100 characters']
  },

  isReimbursable: {
    type: Boolean,
    default: false
  },

  reimbursementStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Approved', 'Rejected', 'Paid', 'Not Applicable'],
      message: 'Reimbursement status must be one of the predefined values'
    },
    default: 'Not Applicable'
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
expenseSchema.index({ userId: 1, expenseDate: -1 });
expenseSchema.index({ budgetId: 1, expenseDate: -1 });
expenseSchema.index({ userId: 1, budgetId: 1 });
expenseSchema.index({ category: 1, expenseDate: -1 });
expenseSchema.index({ createdAt: -1 });

// Virtual for formatted expense amount
expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.expenseAmount);
});

// Virtual for expense age in days
expenseSchema.virtual('daysAgo').get(function() {
  const now = new Date();
  const expenseDate = new Date(this.expenseDate);
  const diffTime = Math.abs(now - expenseDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  // Ensure expense date is not in the future
  if (this.expenseDate > new Date()) {
    this.expenseDate = new Date();
  }
  
  // Set reimbursement status based on reimbursable flag
  if (!this.isReimbursable) {
    this.reimbursementStatus = 'Not Applicable';
  }
  
  next();
});

// Static methods
expenseSchema.statics.getExpensesByUser = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.budgetId) {
    query.budgetId = options.budgetId;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.startDate && options.endDate) {
    query.expenseDate = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .sort({ expenseDate: -1 })
    .limit(options.limit || 50)
    .lean();
};

expenseSchema.statics.getExpensesByBudget = function(budgetId, options = {}) {
  const query = { budgetId, isActive: true };
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  return this.find(query)
    .sort({ expenseDate: -1 })
    .limit(options.limit || 50)
    .lean();
};

expenseSchema.statics.getTotalSpentByBudget = function(budgetId) {
  return this.aggregate([
    { $match: { budgetId: new mongoose.Types.ObjectId(budgetId), isActive: true } },
    { $group: { _id: null, total: { $sum: '$expenseAmount' } } }
  ]);
};

// Instance methods
expenseSchema.methods.markAsReimbursed = function() {
  this.reimbursementStatus = 'Paid';
  return this.save();
};

expenseSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

const Expense = mongoose.model('Expense', expenseSchema, 'expenses');

module.exports = Expense;