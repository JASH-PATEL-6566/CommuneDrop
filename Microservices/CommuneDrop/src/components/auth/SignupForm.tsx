"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";
import GoogleButton from "./GoogleButton";
import { AlertCircle, Loader } from "lucide-react";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const { register, error, isLoading, clearError, isInitializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPasswordError(
      password !== confirmPassword && confirmPassword.length > 0
    );
  }, [password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        setPasswordError(true);
        return;
      }
      if (
        name.trim() &&
        email.trim() &&
        password.trim() &&
        password.length >= 8
      ) {
        try {
          const success = await register(name, email, password);
          if (success) {
            navigate("/verify", { state: { email } });
          }
        } catch (err) {
          console.error("Registration error:", err);
        }
      }
    },
    [name, email, password, confirmPassword, register, navigate]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      switch (field) {
        case "name":
          setName(value);
          break;
        case "email":
          setEmail(value);
          break;
        case "password":
          setPassword(value);
          break;
        case "confirmPassword":
          setConfirmPassword(value);
          break;
      }
      if (error) clearError();
    },
    [error, clearError]
  );

  if (isInitializing) {
    return (
      <div
        className="flex justify-center items-center h-40"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader
          className="w-8 h-8 text-primary animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">Loading authentication status...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-medium text-center">
        Create Your CommuneDrop Account
      </h2>
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle
            className="w-5 h-5 mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Registration Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => handleInputChange("name", e.target.value)}
        className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black text-center"
        required
        aria-label="Full name"
      />
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-black text-center"
        required
        autoComplete="email"
        aria-label="Email address"
      />
      <PasswordInput
        label="Create password"
        password={password}
        setPassword={(value) => handleInputChange("password", value)}
      />
      <PasswordInput
        label="Confirm password"
        password={confirmPassword}
        setPassword={(value) => handleInputChange("confirmPassword", value)}
        error={passwordError}
      />
      {passwordError && (
        <p
          className="text-red-500 text-sm text-center -mt-4"
          aria-live="assertive"
        >
          Passwords do not match
        </p>
      )}
      <button
        type="submit"
        disabled={
          !name.trim() ||
          !email.trim() ||
          !password.trim() ||
          password !== confirmPassword ||
          isLoading
        }
        className="w-full rounded-lg bg-black py-3 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
      <div className="flex items-center before:flex-1 before:border-t after:flex-1 after:border-t">
        <span className="mx-4 text-gray-500">or sign up with</span>
      </div>
      <GoogleButton />
      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="text-black hover:underline font-medium">
          Log in instead
        </a>
      </div>
    </form>
  );
}
