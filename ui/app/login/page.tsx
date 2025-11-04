"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("budget-console-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      // Default to light mode
      setIsDarkMode(false);
      localStorage.setItem("budget-console-theme", "light");
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      // Redirect to dashboard if already logged in
      router.push("/dashboard");
    }
  }, [router]);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("budget-console-theme", newTheme ? "dark" : "light");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate input
      if (!email || !password) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      // API configuration
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
      const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;

      if (!API_BASE_URL || !API_KEY || !CLIENT_ID) {
        setError("Application configuration error. Please contact support.");
        setIsLoading(false);
        return;
      }

      // Make login request
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: email.trim(),
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'x-client-id': CLIENT_ID
          },
          timeout: 10000 // 10 second timeout
        }
      );

      // Handle successful login
      if (response.data && response.data.data) {
        const { token, user, expiresIn } = response.data.data;
        
        // Store authentication data
        localStorage.setItem("auth-token", token);
        localStorage.setItem("user-data", JSON.stringify(user));
        localStorage.setItem("token-expires", expiresIn);
        localStorage.setItem("login-timestamp", new Date().toISOString());

        // Show success message briefly
        console.log("Login successful:", user.email);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError("Invalid response from server. Please try again.");
      }

    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please check your connection and try again.");
      } else if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const message = err.response.data?.message || "Login failed";
        
        switch (status) {
          case 400:
            setError("Please enter valid email and password.");
            break;
          case 401:
            setError("Invalid email or password. Please try again.");
            break;
          case 403:
            setError("Your account has been disabled. Please contact support.");
            break;
          case 429:
            setError("Too many login attempts. Please try again later.");
            break;
          case 500:
            setError("Server error. Please try again later.");
            break;
          default:
            setError(message || "Login failed. Please try again.");
        }
      } else if (err.request) {
        // Network error
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50"
      }`}
    >
      {/* Theme Toggle Switch */}
      <div
        className={`fixed top-6 right-6 z-50 flex items-center space-x-3 p-4 rounded-full shadow-lg transition-all duration-300 ${
          isDarkMode
            ? "bg-white/10 backdrop-blur-md border border-white/20"
            : "bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl"
        }`}
      >
        {/* Sun Icon */}
        <svg
          className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-yellow-500"
          }`}
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

        {/* Toggle Switch */}
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDarkMode ? "bg-gray-600" : "bg-blue-600"
          }`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              isDarkMode ? "translate-x-1" : "translate-x-6"
            }`}
          />
        </button>

        {/* Moon Icon */}
        <svg
          className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? "text-blue-400" : "text-gray-400"
          }`}
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
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-4 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob ${
            isDarkMode ? "bg-purple-500" : "bg-blue-400"
          }`}
        ></div>
        <div
          className={`absolute -top-4 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 ${
            isDarkMode ? "bg-yellow-500" : "bg-purple-400"
          }`}
        ></div>
        <div
          className={`absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 ${
            isDarkMode ? "bg-pink-500" : "bg-indigo-400"
          }`}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
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
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Budget Console
          </h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Manage your finances with confidence
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`backdrop-blur-lg rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
            isDarkMode
              ? "bg-white/10 border border-white/20"
              : "bg-white/70 border border-gray-200 shadow-xl"
          }`}
        >
          <div className="text-center mb-6">
            <h2
              className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Welcome Back
            </h2>
            <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Sign in to access your financial dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode
                      ? "bg-white/10 border border-white/20 text-white placeholder-gray-400"
                      : "bg-white/60 border border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className={`w-5 h-5 ${
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm ${
                    isDarkMode
                      ? "bg-white/10 border border-white/20 text-white placeholder-gray-400"
                      : "bg-white/60 border border-gray-300 text-gray-800 placeholder-gray-500"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className={`w-5 h-5 ${
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className={`rounded focus:ring-blue-500 focus:ring-offset-0 ${
                    isDarkMode
                      ? "border-white/20 bg-white/10 text-blue-500"
                      : "border-gray-300 bg-white text-blue-600"
                  }`}
                />
                <span
                  className={`ml-2 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className={`text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Don't have an account?{" "}
              <a
                href="https://naveend.com/contact"
                target="_blank"
                className={`font-medium transition-colors ${
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Contact administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            © 2025 Budget Console. Secure financial management platform.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
