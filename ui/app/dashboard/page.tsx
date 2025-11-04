"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  monthlyIncome: number;
  currency: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

interface Budget {
  _id: string;
  budgetName: string;
  budgetAmount: number;
  currency: string;
  category: string;
  startDate: string;
  endDate: string;
  spentAmount: number;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

interface BudgetResponse {
  success: boolean;
  data: {
    budgets: Budget[];
    count: number;
    userId: string;
  };
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isBudgetsLoading, setIsBudgetsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

  // Fetch budgets for user
  const fetchBudgets = async (userId: string) => {
    setIsBudgetsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/budgets/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!,
          'x-client-id': CLIENT_ID!
        }
      });

      if (response.ok) {
        const data: BudgetResponse = await response.json();
        setBudgets(data.data.budgets);
      } else {
        console.error('Failed to fetch budgets:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsBudgetsLoading(false);
    }
  };

  // Create new budget
  const createBudget = async (budgetData: {
    budgetName: string;
    budgetAmount: number;
    category: string;
    startDate: string;
    endDate: string;
    description?: string;
  }) => {
    if (!user) return;

    setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!,
          'x-client-id': CLIENT_ID!
        },
        body: JSON.stringify({
          ...budgetData,
          currency: user.currency,
          userId: user._id
        })
      });

      if (response.ok) {
        // Refresh budgets list
        fetchBudgets(user._id);
        setShowCreateModal(false);
      } else {
        console.error('Failed to create budget:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem("budget-console-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    // Check authentication
    const token = localStorage.getItem("auth-token");
    const userData = localStorage.getItem("user-data");

    if (!token || !userData) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Fetch budgets after setting user
      fetchBudgets(parsedUser._id);
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Clear invalid data and redirect to login
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user-data");
      router.push("/login");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user-data");
    localStorage.removeItem("token-expires");
    localStorage.removeItem("login-timestamp");

    // Redirect to login
    router.push("/login");
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("budget-console-theme", newTheme ? "dark" : "light");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            {/* Logo */}
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mr-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Budget Console
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-gray-300 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* User Info */}
              <div
                className={`text-right ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs opacity-75">{user.email}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div
          className={`backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 ${
            isDarkMode
              ? "bg-white/10 border border-white/20"
              : "bg-white/70 border border-gray-200"
          }`}
        >
          <h2
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Welcome back, {user.firstName}!
          </h2>
          <p
            className={`text-lg ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Here's your budget overview and financial insights.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Income */}
          <div
            className={`backdrop-blur-lg rounded-xl p-6 ${
              isDarkMode
                ? "bg-white/10 border border-white/20"
                : "bg-white/70 border border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Monthly Income
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatCurrency(user.monthlyIncome, user.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div
            className={`backdrop-blur-lg rounded-xl p-6 ${
              isDarkMode
                ? "bg-white/10 border border-white/20"
                : "bg-white/70 border border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-lg ${
                  user.isActive ? "bg-blue-500" : "bg-gray-500"
                }`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Account Status
                </p>
                <p
                  className={`text-lg font-bold ${
                    user.isActive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Email Verification */}
          <div
            className={`backdrop-blur-lg rounded-xl p-6 ${
              isDarkMode
                ? "bg-white/10 border border-white/20"
                : "bg-white/70 border border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-lg ${
                  user.isEmailVerified ? "bg-green-500" : "bg-yellow-500"
                }`}
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Email Status
                </p>
                <p
                  className={`text-lg font-bold ${
                    user.isEmailVerified ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {user.isEmailVerified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Last Login */}
          <div
            className={`backdrop-blur-lg rounded-xl p-6 ${
              isDarkMode
                ? "bg-white/10 border border-white/20"
                : "bg-white/70 border border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-500 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Last Login
                </p>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {formatDate(user.lastLogin)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Management Section */}
        <div
          className={`backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ${
            isDarkMode
              ? "bg-white/10 border border-white/20"
              : "bg-white/70 border border-gray-200"
          }`}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <h3
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  My Budgets
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Manage your budget allocations and track spending
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg
                  className="w-5 h-5 inline-block mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Budget
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {isBudgetsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span
                  className={`ml-3 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Loading budgets...
                </span>
              </div>
            ) : budgets.length === 0 ? (
              /* Empty State - Create Budget Widget */
              <div className="text-center py-12">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                    isDarkMode ? "bg-white/10" : "bg-gray-100"
                  }`}
                >
                  <svg
                    className={`w-8 h-8 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  No budgets yet
                </h3>
                <p
                  className={`text-sm mb-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Create your first budget to start tracking your expenses and financial goals.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg
                    className="w-5 h-5 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Budget
                </button>
              </div>
            ) : (
              /* Budget Table */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDarkMode
                          ? "border-white/10 text-gray-300"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <th className="text-left py-3 px-4 font-medium">Budget Name</th>
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-left py-3 px-4 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Progress</th>
                      <th className="text-left py-3 px-4 font-medium">Period</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => {
                      const progress = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
                      const progressColor = progress < 50 ? 'bg-green-500' : progress < 80 ? 'bg-yellow-500' : 'bg-red-500';
                      
                      return (
                        <tr
                          key={budget._id}
                          onClick={() => router.push(`/dashboard/budget/${budget._id}`)}
                          className={`border-b transition-colors hover:bg-white/5 cursor-pointer hover:scale-[1.01] transform transition-all duration-200 ${
                            isDarkMode
                              ? "border-white/5 text-white hover:bg-white/10"
                              : "border-gray-100 text-gray-800 hover:bg-blue-50/50"
                          }`}
                          title={`Click to view ${budget.budgetName} details`}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium">{budget.budgetName}</div>
                              {budget.description && (
                                <div
                                  className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {budget.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode
                                  ? "bg-white/10 text-gray-300"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {budget.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium">
                              {formatCurrency(budget.budgetAmount, budget.currency)}
                            </div>
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Spent: {formatCurrency(budget.spentAmount || 0, budget.currency)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="w-full">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div
                                className={`w-full rounded-full h-2 ${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                }`}
                              >
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                budget.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {budget.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Budget Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`max-w-md w-full rounded-2xl shadow-2xl ${
                isDarkMode
                  ? "bg-gray-900/95 border border-white/20"
                  : "bg-white/95 border border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Create New Budget
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-white hover:bg-white/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createBudget({
                      budgetName: formData.get('budgetName') as string,
                      budgetAmount: parseFloat(formData.get('budgetAmount') as string),
                      category: formData.get('category') as string,
                      startDate: formData.get('startDate') as string,
                      endDate: formData.get('endDate') as string,
                      description: formData.get('description') as string || undefined,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Budget Name *
                    </label>
                    <input
                      type="text"
                      name="budgetName"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        isDarkMode
                          ? "bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="e.g., Monthly Groceries"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Budget Amount *
                    </label>
                    <input
                      type="number"
                      name="budgetAmount"
                      required
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        isDarkMode
                          ? "bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Category *
                    </label>
                    <select
                      name="category"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                        isDarkMode
                          ? "bg-white/5 border-white/20 text-white focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    >
                      <option value="Food">Food</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Bills">Bills</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                          isDarkMode
                            ? "bg-white/5 border-white/20 text-white focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                          isDarkMode
                            ? "bg-white/5 border-white/20 text-white focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                        isDarkMode
                          ? "bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-blue-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="Optional description for this budget..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                        isDarkMode
                          ? "bg-white/10 text-gray-300 hover:bg-white/20"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Budget'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
