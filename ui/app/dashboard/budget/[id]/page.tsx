"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Budget {
  _id: string;
  budgetName: string;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  category: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Expense {
  _id: string;
  expenseName: string;
  expenseAmount: number;
  currency: string;
  category: string;
  expenseDate: string;
  description?: string;
  vendor?: string;
  location?: string;
  paymentMethod: string;
  isReimbursable: boolean;
  createdAt: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
}

export default function BudgetDetailPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setBudgetLoading] = useState(true);
  const [isExpensesLoading, setExpensesLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);

  const router = useRouter();
  const params = useParams();
  const budgetId = params.id as string;

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

  // Load theme and user data
  useEffect(() => {
    const savedTheme = localStorage.getItem("budget-console-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    const userData = localStorage.getItem("user-data");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login");
        return;
      }
    } else {
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch budget details
  const fetchBudgetDetails = async () => {
    if (!user) return;

    setBudgetLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${user._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!,
          'x-client-id': CLIENT_ID!
        }
      });

      if (response.ok) {
        const data = await response.json();
        const foundBudget = data.data.budgets.find((b: Budget) => b._id === budgetId);
        if (foundBudget) {
          setBudget(foundBudget);
        } else {
          console.error('Budget not found');
          router.push('/dashboard');
        }
      } else {
        console.error('Failed to fetch budget details:', response.statusText);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching budget details:', error);
      router.push('/dashboard');
    } finally {
      setBudgetLoading(false);
    }
  };

  // Fetch expenses for this budget
  const fetchExpenses = async () => {
    if (!user) return;

    setExpensesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/user/${user._id}/budget/${budgetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!,
          'x-client-id': CLIENT_ID!
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data.expenses || []);
      } else {
        console.error('Failed to fetch expenses:', response.statusText);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Create new expense
  const createExpense = async (expenseData: {
    expenseName: string;
    expenseAmount: number;
    category: string;
    description?: string;
    vendor?: string;
    location?: string;
    paymentMethod: string;
    expenseDate: string;
  }) => {
    if (!user || !budget) return;

    setIsCreatingExpense(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!,
          'x-client-id': CLIENT_ID!
        },
        body: JSON.stringify({
          ...expenseData,
          userId: user._id,
          budgetId: budget._id,
          currency: budget.currency
        })
      });

      if (response.ok) {
        // Refresh expenses and budget details
        fetchExpenses();
        fetchBudgetDetails();
        setShowCreateExpenseModal(false);
      } else {
        console.error('Failed to create expense:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  useEffect(() => {
    if (user && budgetId) {
      fetchBudgetDetails();
      fetchExpenses();
    }
  }, [user, budgetId]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("budget-console-theme", newTheme ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");
    localStorage.removeItem("token-expires");
    localStorage.removeItem("login-timestamp");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading budget details...</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Budget not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const spentPercentage = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
  const remainingAmount = budget.budgetAmount - budget.spentAmount;
  const isOverBudget = budget.spentAmount > budget.budgetAmount;

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50"
      }`}
    >
      {/* Header */}
      <header
        className={`backdrop-blur-lg border-b transition-all duration-300 ${
          isDarkMode
            ? "bg-white/5 border-white/10"
            : "bg-white/70 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Budget Console
                </span>
              </div>
              
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm">
                <Link
                  href="/dashboard"
                  className={`hover:text-blue-600 transition-colors ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Dashboard
                </Link>
                <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>/</span>
                <span className={isDarkMode ? "text-white" : "text-gray-800"}>
                  {budget.budgetName}
                </span>
              </nav>
            </div>

            {/* User menu and theme toggle */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      : "bg-red-50 hover:bg-red-100 text-red-600"
                  }`}
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Budget Header */}
        <div
          className={`backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 ${
            isDarkMode
              ? "bg-white/10 border border-white/20"
              : "bg-white/70 border border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1
                className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {budget.budgetName}
              </h1>
              <p
                className={`text-lg ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Category: {budget.category}
              </p>
              {budget.description && (
                <p
                  className={`mt-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {budget.description}
                </p>
              )}
            </div>
            
            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  budget.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {budget.isActive ? "Active" : "Inactive"}
              </div>
              <p
                className={`mt-2 text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </p>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Budget Progress
              </span>
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {spentPercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isOverBudget
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : spentPercentage > 80
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-to-r from-green-500 to-blue-500"
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {formatCurrency(budget.budgetAmount, budget.currency)}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Budget
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  isOverBudget 
                    ? "text-red-500" 
                    : isDarkMode ? "text-white" : "text-gray-800"
                }`}>
                  {formatCurrency(budget.spentAmount, budget.currency)}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Spent
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${
                  remainingAmount < 0 
                    ? "text-red-500" 
                    : "text-green-500"
                }`}>
                  {formatCurrency(remainingAmount, budget.currency)}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {remainingAmount < 0 ? "Over Budget" : "Remaining"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div
          className={`backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ${
            isDarkMode
              ? "bg-white/10 border border-white/20"
              : "bg-white/70 border border-gray-200"
          }`}
        >
          {/* Section Header */}
          <div className="p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Expenses
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button
                onClick={() => setShowCreateExpenseModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Expense
              </button>
            </div>
          </div>

          {/* Expenses Content */}
          <div className="p-6">
            {isExpensesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Loading expenses...
                </p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className={`w-8 h-8 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  No expenses yet
                </h3>
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Start by adding your first expense to this budget.
                </p>
                <button
                  onClick={() => setShowCreateExpenseModal(true)}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
                      <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Expense
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Amount
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Category
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Date
                      </th>
                      <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense._id}
                        className={`border-b hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          isDarkMode ? "border-white/10" : "border-gray-100"
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                              {expense.expenseName}
                            </p>
                            {expense.vendor && (
                              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {expense.vendor}
                              </p>
                            )}
                            {expense.description && (
                              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {expense.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                            {formatCurrency(expense.expenseAmount, expense.currency)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode 
                              ? "bg-blue-900/30 text-blue-400" 
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {formatDate(expense.expenseDate)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {expense.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Expense Modal */}
        {showCreateExpenseModal && (
          <CreateExpenseModal
            isOpen={showCreateExpenseModal}
            onClose={() => setShowCreateExpenseModal(false)}
            onSubmit={createExpense}
            isLoading={isCreatingExpense}
            isDarkMode={isDarkMode}
            budget={budget}
          />
        )}
      </main>
    </div>
  );
}

// Create Expense Modal Component
interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    expenseName: string;
    expenseAmount: number;
    category: string;
    description?: string;
    vendor?: string;
    location?: string;
    paymentMethod: string;
    expenseDate: string;
  }) => void;
  isLoading: boolean;
  isDarkMode: boolean;
  budget: Budget;
}

function CreateExpenseModal({ isOpen, onClose, onSubmit, isLoading, isDarkMode, budget }: CreateExpenseModalProps) {
  const [formData, setFormData] = useState({
    expenseName: "",
    expenseAmount: "",
    category: "Miscellaneous",
    description: "",
    vendor: "",
    location: "",
    paymentMethod: "Cash",
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const categories = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment", "Bills & Utilities",
    "Healthcare", "Travel", "Education", "Business", "Personal Care", "Miscellaneous"
  ];

  const paymentMethods = [
    "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet", "Check"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expenseName.trim() || !formData.expenseAmount) return;

    onSubmit({
      ...formData,
      expenseAmount: parseFloat(formData.expenseAmount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${
          isDarkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            Add Expense to {budget.budgetName}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Expense Name *
            </label>
            <input
              type="text"
              value={formData.expenseName}
              onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Enter expense name"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Amount ({budget.currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.expenseAmount}
              onChange={(e) => setFormData({ ...formData, expenseAmount: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Date
            </label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Vendor (Optional)
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Store or vendor name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="Additional details about this expense"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.expenseName.trim() || !formData.expenseAmount}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}