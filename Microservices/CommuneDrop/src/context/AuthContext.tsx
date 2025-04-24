"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { AuthState, User, UserProfile } from "../types/auth";
import { tokenStorage } from "../utils/tokenStorage";
import { jwtUtils } from "../utils/jwtUtils";
import { api } from "../services/auth-service";
import { userService } from "../services/user-service";
import { paymentService } from "../services/payment-service";
import { supabase } from "../lib/supabase";

const DEFAULT_PROFILE_IMAGE = "/images/default-profile.png";

const initialState: AuthState = {
  user: null,
  userProfile: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  customerId: null, // Initialize customerId as null
};

type AuthAction =
  | { type: "LOGIN_START" }
  | {
      type: "LOGIN_SUCCESS";
      payload: { token: string; refreshToken: string; user: User };
    }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "REGISTER_START" }
  | {
      type: "REGISTER_SUCCESS";
      payload: { token: string; refreshToken: string; user: User };
    }
  | { type: "REGISTER_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | {
      type: "REFRESH_TOKEN_SUCCESS";
      payload: { token: string; refreshToken: string };
    }
  | {
      type: "UPDATE_USER_PROFILE";
      payload: UserProfile;
    }
  | {
      type: "SET_CUSTOMER_ID";
      payload: string;
    };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        userProfile: null,
        token: null,
        refreshToken: null,
        customerId: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userProfile: null,
        token: null,
        refreshToken: null,
        customerId: null,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "REFRESH_TOKEN_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    case "UPDATE_USER_PROFILE":
      return {
        ...state,
        userProfile: action.payload,
        // Also update the basic user info
        user: {
          ...state.user!,
          name: action.payload.name,
          email: action.payload.email,
        },
      };
    case "SET_CUSTOMER_ID":
      return {
        ...state,
        customerId: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isInitializing: boolean;
  updateUserProfile: (profile: UserProfile) => void;
  refreshUserProfile: () => Promise<void>;
  fetchCustomerId: () => Promise<string | null>;
  loginWithGoogle: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch user profile
  const fetchUserProfile = async (email: string) => {
    try {
      // Check if we already have the profile in localStorage
      const cachedProfile = tokenStorage.getUserProfile();
      if (cachedProfile && cachedProfile.email === email) {
        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: cachedProfile,
        });
        return;
      }

      // If not cached or email doesn't match, fetch from API
      const response = await userService.getProfile();
      if (response.success && response.data) {
        // Update the user object with the name from the profile
        const updatedUser = {
          ...state.user!,
          name: response.data.name,
          email: response.data.email,
        };
        tokenStorage.setUser(updatedUser);

        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: response.data,
        });
        // Store in localStorage
        tokenStorage.setUserProfile(response.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (!state.user?.email) return;

    try {
      const response = await userService.getProfile();
      if (response.success && response.data) {
        dispatch({
          type: "UPDATE_USER_PROFILE",
          payload: response.data,
        });
        // Store in localStorage
        tokenStorage.setUserProfile(response.data);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  // Update the fetchCustomerId function to handle the case when customer is not found
  const fetchCustomerId = async (): Promise<string | null> => {
    // If we already have a customer ID in state, return it
    if (state.customerId) {
      return state.customerId;
    }
    // If no user is logged in, return null
    if (!state.user?.email) {
      return null;
    }
    try {
      console.log("Fetching customer ID for user:", state.user.email);
      // Fetch customer ID from payment service
      const response = await paymentService.getCustomerByEmail(
        state.user.email
      );
      if (response.success && response.customerId) {
        console.log("Found customer ID:", response.customerId);
        // Store in state
        dispatch({
          type: "SET_CUSTOMER_ID",
          payload: response.customerId,
        });
        return response.customerId;
      } else {
        console.warn(
          "No valid Stripe customer ID found for user:",
          state.user.email
        );
        // Don't create a customer here - it should only be created during registration
        setError(
          "Your payment profile isn't set up correctly. Please contact support."
        );
        return null;
      }
    } catch (error) {
      console.error("Error fetching customer ID:", error);
      return null;
    }
  };

  // Update the createCustomerDuringRegistration function to use the correct endpoint
  const createCustomerDuringRegistration = async (
    email: string,
    name: string
  ): Promise<string | null> => {
    try {
      console.log("Creating customer record for newly registered user:", email);

      // Call the payment service to create a customer using the POST /customer endpoint
      const response = await paymentService.createCustomer(name, email);

      if (response.success && response.customerId) {
        console.log(
          "Successfully created customer with ID:",
          response.customerId
        );

        // Store in state
        dispatch({
          type: "SET_CUSTOMER_ID",
          payload: response.customerId,
        });

        return response.customerId;
      } else {
        console.warn(
          "Failed to create customer during registration:",
          response.message
        );
        return null;
      }
    } catch (error) {
      console.error("Error creating customer during registration:", error);
      return null;
    }
  };

  // Update the useEffect that initializes auth to ensure user.id is properly set
  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true);
      try {
        // Check for existing Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_IN" && session) {
            // Get user details from session
            const supabaseUser = session.user;

            if (supabaseUser) {
              const email = supabaseUser.email || "";
              const name =
                supabaseUser.user_metadata?.full_name ||
                supabaseUser.user_metadata?.name ||
                "";

              // Extract profile image URL from user metadata
              const profileImage =
                supabaseUser.user_metadata?.avatar_url ||
                supabaseUser.user_metadata?.picture ||
                DEFAULT_PROFILE_IMAGE;

              // Get tokens from session
              const token = session.access_token;
              const refreshToken = session.refresh_token;

              // Store tokens
              tokenStorage.setTokens(token, refreshToken);

              // Create user object with profile image and ENSURE ID IS SET
              const user: User = {
                id: supabaseUser.id, // Make sure ID is set from Supabase
                email,
                name,
              };

              console.log("Setting user with ID:", user.id); // Add this debug line
              tokenStorage.setUser(user);

              // Update auth state
              dispatch({
                type: "LOGIN_SUCCESS",
                payload: { token, refreshToken, user },
              });

              // Create a basic profile with the Google profile image
              const basicProfile: UserProfile = {
                email,
                name,
                profileImage,
              };

              // Store the basic profile
              tokenStorage.setUserProfile(basicProfile);

              // Update the user profile in state
              dispatch({
                type: "UPDATE_USER_PROFILE",
                payload: basicProfile,
              });

              // Fetch user profile
              await fetchUserProfile(email);

              // Fetch customer ID
              await fetchCustomerId();
            }
          } else if (event === "SIGNED_OUT") {
            tokenStorage.clearTokens();
            dispatch({ type: "LOGOUT" });
          }
        });

        // Initialize with existing session if available
        if (session) {
          const supabaseUser = session.user;

          if (supabaseUser) {
            const email = supabaseUser.email || "";
            const name =
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              "";

            // Extract profile image URL from user metadata
            const profileImage =
              supabaseUser.user_metadata?.avatar_url ||
              supabaseUser.user_metadata?.picture ||
              DEFAULT_PROFILE_IMAGE;

            // Get tokens from session
            const token = session.access_token;
            const refreshToken = session.refresh_token;

            // Store tokens
            tokenStorage.setTokens(token, refreshToken);

            // Create user object WITH ID
            const user: User = {
              id: supabaseUser.id, // Make sure ID is set from Supabase
              email,
              name,
            };

            console.log("Setting user with ID on init:", user.id); // Add this debug line
            tokenStorage.setUser(user);

            // Create a basic profile with the Google profile image
            const basicProfile: UserProfile = {
              email,
              name,
              profileImage,
            };

            // Store the basic profile
            tokenStorage.setUserProfile(basicProfile);

            // Update auth state
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: { token, refreshToken, user },
            });

            // Also update the profile with the image
            dispatch({
              type: "UPDATE_USER_PROFILE",
              payload: basicProfile,
            });

            // Fetch user profile
            await fetchUserProfile(email);

            // Fetch customer ID
            await fetchCustomerId();
          }
        } else {
          // No session found, check for stored tokens as fallback
          const token = tokenStorage.getToken();
          const refreshToken = tokenStorage.getRefreshToken();

          if (!token || !refreshToken) {
            dispatch({ type: "LOGOUT" });
            setIsInitializing(false);
            return;
          }

          // Continue with your existing token validation logic...
        }

        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        tokenStorage.clearTokens();
        dispatch({ type: "LOGOUT" });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Make sure the user object always has an ID property
  // Update the login function to include the user ID

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await api.auth.login({ email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;
        tokenStorage.setTokens(token, refreshToken);
        const userEmail = jwtUtils.getUserEmail(token);
        const userId = jwtUtils.getUserId(token); // Get user ID from token

        if (userEmail) {
          // Include the user ID in the user object
          const user: User = {
            email: userEmail,
            id: userId || userEmail, // Use ID from token or fall back to email
          };
          tokenStorage.setUser(user);

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { token, refreshToken, user },
          });

          // Fetch user profile after successful login
          await fetchUserProfile(userEmail);

          // Fetch customer ID after successful login
          await fetchCustomerId();

          return true;
        } else {
          throw new Error("Invalid token received");
        }
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: response.message || "Login failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    dispatch({ type: "REGISTER_START" });

    try {
      const response = await api.auth.register({ name, email, password });

      if (response.success) {
        const { token, refreshToken } = response.data;
        tokenStorage.setTokens(token, refreshToken);
        const user: User = { email, name };
        tokenStorage.setUser(user);

        dispatch({
          type: "REGISTER_SUCCESS",
          payload: { token, refreshToken, user },
        });

        // Create customer record after successful registration
        await createCustomerDuringRegistration(email, name);

        // Fetch user profile after successful registration
        await fetchUserProfile(email);

        return true;
      } else {
        dispatch({
          type: "REGISTER_FAILURE",
          payload: response.message || "Registration failed. Please try again.",
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: "REGISTER_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    tokenStorage.clearTokens();
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUserProfile = (profile: UserProfile) => {
    dispatch({
      type: "UPDATE_USER_PROFILE",
      payload: profile,
    });
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // The page will redirect to Google for authentication
      return true;
    } catch (error) {
      console.error("Google login error:", error);
      dispatch({
        type: "LOGIN_FAILURE",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to login with Google",
      });
      return false;
    }
  };

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      loginWithGoogle, // Add this line
      clearError,
      isInitializing,
      updateUserProfile,
      refreshUserProfile,
      fetchCustomerId,
      error,
    }),
    [state, isInitializing, error]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
