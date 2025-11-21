
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangleIcon } from "./icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyReset = () => {
      if(window.confirm("This will clear local database storage to fix the crash. Ensure you have a backup if possible. Continue?")) {
          localStorage.clear();
          window.location.reload();
      }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-red-800 rounded-lg p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-500">
                <AlertTriangleIcon className="w-12 h-12" />
                <h1 className="text-2xl font-bold">Something went wrong</h1>
            </div>
            <p className="text-gray-300 mb-4">
              The application encountered a critical error. To protect your security, the vault has been halted.
            </p>
            <div className="bg-black/30 p-4 rounded text-red-400 font-mono text-sm mb-6 overflow-auto max-h-40">
                {this.state.error?.message || "Unknown Error"}
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={this.handleReload}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                >
                    Reload Application
                </button>
                <button 
                    onClick={this.handleEmergencyReset}
                    className="px-4 py-2 text-red-400 hover:text-red-300 text-sm"
                >
                    Reset Data
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
