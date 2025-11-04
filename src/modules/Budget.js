/**
 * Budget Model
 * MongoDB schema for budget management
 */

const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  budgetName: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    minlength: [2, 'Budget name must be at least 2 characters long'],
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster queries by user
  },
  budgetAmount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Budget amount must be a valid positive number'
    }
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY', 'BRL', 'MXN'],
    default: 'USD',
    uppercase: true
  },
  category: {
    type: String,
    default: 'non-categorized',
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Spent amount must be a valid positive number'
    }
  },
  remainingAmount: {
    type: Number,
    default: function() {
      return this.budgetAmount - this.spentAmount;
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%'],
    default: 80,
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value >= 0 && value <= 100;
      },
      message: 'Alert threshold must be a percentage between 0 and 100'
    }
  },
  isAlertEnabled: {
    type: Boolean,
    default: true
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
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields and format response
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      
      // Format numbers to 2 decimal places
      if (ret.budgetAmount) ret.budgetAmount = Number(ret.budgetAmount.toFixed(2));
      if (ret.spentAmount) ret.spentAmount = Number(ret.spentAmount.toFixed(2));
      if (ret.remainingAmount) ret.remainingAmount = Number(ret.remainingAmount.toFixed(2));
      
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
BudgetSchema.virtual('progressPercentage').get(function() {
  if (this.budgetAmount === 0) return 0;
  return Number(((this.spentAmount / this.budgetAmount) * 100).toFixed(2));
});

// Virtual for budget status
BudgetSchema.virtual('budgetStatus').get(function() {
  const progressPercentage = this.progressPercentage;
  
  if (progressPercentage >= 100) return 'exceeded';
  if (progressPercentage >= this.alertThreshold) return 'warning';
  if (progressPercentage >= 50) return 'on-track';
  return 'under-budget';
});

// Virtual for days remaining
BudgetSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for is expired
BudgetSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.endDate);
});

// Indexes for better query performance
BudgetSchema.index({ userId: 1, isActive: 1 }); // Compound index for user's active budgets
BudgetSchema.index({ userId: 1, category: 1 }); // Index for category-based queries
BudgetSchema.index({ startDate: 1, endDate: 1 }); // Index for date range queries
BudgetSchema.index({ createdAt: -1 }); // Index for sorting by creation date
BudgetSchema.index({ userId: 1, startDate: 1, endDate: 1 }); // Index for date-based user queries

// Pre-save middleware to calculate remaining amount
BudgetSchema.pre('save', function(next) {
  // Calculate remaining amount
  this.remainingAmount = this.budgetAmount - this.spentAmount;
  
  // Ensure spent amount doesn't exceed budget (optional constraint)
  if (this.spentAmount > this.budgetAmount) {
    console.warn(`Budget ${this.budgetName} exceeded: spent ${this.spentAmount}, budget ${this.budgetAmount}`);
  }
  
  next();
});

// Pre-update middleware
BudgetSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate();
  if (update.budgetAmount !== undefined || update.spentAmount !== undefined) {
    // If updating amounts, ensure remaining amount is recalculated
    const budgetAmount = update.budgetAmount || this.budgetAmount;
    const spentAmount = update.spentAmount || this.spentAmount;
    update.remainingAmount = budgetAmount - spentAmount;
  }
  next();
});

// Static methods for common queries
BudgetSchema.statics.findByUserId = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.category) query.category = options.category;
  if (options.isActive !== undefined) query.isActive = options.isActive;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName email');
};

BudgetSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    userId, 
    isActive: true,
    endDate: { $gte: new Date() }
  }).sort({ createdAt: -1 });
};

BudgetSchema.statics.findExpiredByUser = function(userId) {
  return this.find({ 
    userId, 
    endDate: { $lt: new Date() }
  }).sort({ endDate: -1 });
};

// Instance methods
BudgetSchema.methods.addExpense = function(amount) {
  this.spentAmount += amount;
  this.remainingAmount = this.budgetAmount - this.spentAmount;
  return this.save();
};

BudgetSchema.methods.removeExpense = function(amount) {
  this.spentAmount = Math.max(0, this.spentAmount - amount);
  this.remainingAmount = this.budgetAmount - this.spentAmount;
  return this.save();
};

BudgetSchema.methods.resetBudget = function() {
  this.spentAmount = 0;
  this.remainingAmount = this.budgetAmount;
  return this.save();
};

BudgetSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

BudgetSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Create the model
const Budget = mongoose.model('Budget', BudgetSchema);

module.exports = Budget;