/**
 * Main Database Connection
 * MongoDB connection setup using Mongoose
 */

const mongoose = require("mongoose");
require("dotenv").config();

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.connection = null;
  }

  /**
   * Connect to MongoDB database
   * @returns {Promise} - Connection promise
   */
  async connect() {
    // If already connected and connection is healthy, return it
    if (this.isConnected && mongoose.connection.readyState === 1) {
      console.log("📦 Database: Using existing healthy connection");
      return mongoose.connection;
    }

    // If connection is in progress, return existing promise
    if (this.connectionPromise) {
      console.log("📦 Database: Connection in progress, waiting...");
      return this.connectionPromise;
    }

    // Reset connection state if not healthy
    if (mongoose.connection.readyState !== 0) {
      console.log("📦 Database: Resetting unhealthy connection");
      try {
        await mongoose.connection.close();
      } catch (e) {
        console.log("📦 Database: Error closing connection:", e.message);
      }
    }

    try {
      console.log("📦 Database: Connecting to MongoDB...");

      // Check if MongoDB URI is configured
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is not configured");
      }

      // Connection options optimized for serverless/Lambda - Ultra aggressive settings
      const options = {
        maxPoolSize: 1, // Single connection only
        serverSelectionTimeoutMS: 3000, // Longer server selection timeout
        socketTimeoutMS: 10000, // Longer socket timeout
        connectTimeoutMS: 5000, // Longer connection timeout
        bufferCommands: false, // Disable mongoose buffering
        heartbeatFrequencyMS: 300000, // Less frequent heartbeat
        maxIdleTimeMS: 30000, // Keep connections longer
        retryWrites: false, // Disable retry writes
        retryReads: false, // Disable retry reads
        minPoolSize: 0, // No minimum connections
        maxConnecting: 1, // Limit concurrent connections
        autoIndex: false, // Don't build indexes
        autoCreate: false, // Don't auto-create collections
      };

      // Create connection promise with longer timeout
      this.connectionPromise = Promise.race([
        mongoose.connect(process.env.MONGODB_URI, options),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout after 8 seconds")),
            8000
          )
        ),
      ]);

      // Wait for connection
      await this.connectionPromise;

      this.isConnected = true;
      console.log("✅ Database: Connected to MongoDB successfully");
      console.log(
        "📍 Database: Connected to database:",
        mongoose.connection.db.databaseName
      );

      // Connection event listeners
      mongoose.connection.on("error", (error) => {
        console.error("❌ Database: Connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ Database: Disconnected from MongoDB");
        this.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 Database: Reconnected to MongoDB");
        this.isConnected = true;
      });

      return mongoose.connection;
    } catch (error) {
      console.error(
        "❌ Database: Failed to connect to MongoDB:",
        error.message
      );
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise}
   */
  async disconnect() {
    if (!this.isConnected) {
      console.log("📦 Database: Already disconnected");
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log("✅ Database: Disconnected from MongoDB");
    } catch (error) {
      console.error("❌ Database: Error disconnecting:", error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * Health check for database connection
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: "disconnected",
          message: "Database is not connected",
        };
      }

      // Simple ping to check if database is responsive
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        message: "Database connection is healthy",
        details: this.getConnectionStatus(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: "Database health check failed",
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

/**
 * Middleware to ensure database connection before processing requests
 * @param {Function} handler - The request handler function
 * @returns {Function} - Wrapped handler with database connection
 */
const withDatabaseConnection = (handler) => {
  return async (event, context) => {
    // Set Lambda context to not wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      console.log("🔌 Database Middleware: Attempting connection...");

      // Add timeout for the entire database operation - increased for stability
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database operation timeout")), 15000)
      );

      const connectionPromise = (async () => {
        // Ensure database is connected
        await dbConnection.connect();

        // Add database connection to event context
        event.db = mongoose.connection;
        event.dbStatus = dbConnection.getConnectionStatus();

        console.log(
          "✅ Database Middleware: Connection established, executing handler..."
        );

        // Execute the handler
        return await handler(event, context);
      })();

      // Race between connection/handler execution and timeout
      return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
      console.error("❌ Database Middleware: Operation failed:", error.message);
      console.error("Error stack:", error.stack);

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type, x-api-key, x-client-id",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          error: "Database Connection Error",
          message: error.message.includes("timeout")
            ? "Database connection timeout. Please try again."
            : "Unable to connect to database",
          timestamp: new Date().toISOString(),
        }),
      };
    }
  };
};

module.exports = {
  dbConnection,
  withDatabaseConnection,
  mongoose,
};
