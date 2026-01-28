/**
 * Structured logging utility
 * Provides consistent logging across the application with context
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
  timestamp?: string;
  level?: LogLevel;
  message?: string;
  error?: Error | unknown;
  stack?: string;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName = "asset-tracker") {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || "development";
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogContext {
    const log: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    };

    // Extract error details if error object is present
    if (context?.error) {
      const error = context.error as Error;
      log.errorMessage = error.message;
      log.errorName = error.name;
      log.stack = error.stack;
      
      // Include any custom error properties
      if (error && typeof error === "object") {
        Object.keys(error).forEach((key) => {
          if (!["message", "name", "stack"].includes(key)) {
            log[`error_${key}`] = error[key as keyof Error];
          }
        });
      }
    }

    return log;
  }

  private write(level: LogLevel, message: string, context?: LogContext) {
    const log = this.formatLog(level, message, context);

    // In production, output JSON for log aggregation tools
    if (this.environment === "production") {
      console.log(JSON.stringify(log));
    } else {
      // In development, use colored console output
      const colorMap = {
        debug: "\x1b[36m", // Cyan
        info: "\x1b[32m",  // Green
        warn: "\x1b[33m",  // Yellow
        error: "\x1b[31m", // Red
      };
      const reset = "\x1b[0m";
      const color = colorMap[level];
      
      console.log(
        `${color}[${log.timestamp}] [${level.toUpperCase()}]${reset} ${message}`,
        context ? context : ""
      );
      
      if (context?.error) {
        console.error(context.error);
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.write("error", message, context);
  }

  // API-specific logging helpers
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API Request: ${method} ${path}`, {
      type: "api_request",
      method,
      path,
      ...context,
    });
  }

  apiResponse(method: string, path: string, status: number, duration?: number, context?: LogContext) {
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    this.write(level, `API Response: ${method} ${path} - ${status}`, {
      type: "api_response",
      method,
      path,
      status,
      duration,
      ...context,
    });
  }

  apiError(method: string, path: string, error: Error | unknown, context?: LogContext) {
    this.error(`API Error: ${method} ${path}`, {
      type: "api_error",
      method,
      path,
      error,
      ...context,
    });
  }

  // Database operation logging
  dbQuery(operation: string, model: string, duration?: number, context?: LogContext) {
    this.debug(`DB Query: ${operation} on ${model}`, {
      type: "db_query",
      operation,
      model,
      duration,
      ...context,
    });
  }

  dbError(operation: string, model: string, error: Error | unknown, context?: LogContext) {
    this.error(`DB Error: ${operation} on ${model}`, {
      type: "db_error",
      operation,
      model,
      error,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };
