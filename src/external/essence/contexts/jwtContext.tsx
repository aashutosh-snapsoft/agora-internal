"use client";

import {
  createContext,
  FC,
  useEffect,
  useReducer,
  PropsWithChildren,
  useCallback,
} from "react";
import axios from "axios";
// CUSTOM LOADING COMPONENT
import { LoadingProgress } from "@/external/essence/components/loader";

const API_URL = "http://localhost:5000";

interface INITIAL_AUTH_STATE {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: null | { _id: string; name: string; email: string };
}

const initialState: INITIAL_AUTH_STATE = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

// Client-side token storage is disabled; BFF handles auth with HttpOnly cookies.
const setSession = (_accessToken: string | null) => {
  delete axios.defaults.headers.common.Authorization;
};

const reducer = (state: INITIAL_AUTH_STATE, action: any) => {
  switch (action.type) {
    case "INIT": {
      return {
        isInitialized: true,
        user: action.payload.user,
        isAuthenticated: action.payload.isAuthenticated,
      };
    }
    case "LOGIN": {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    }
    case "LOGOUT": {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    }
    case "REGISTER": {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    }
    default: {
      return state;
    }
  }
};

interface ContextProps extends INITIAL_AUTH_STATE {
  method: string;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext({} as ContextProps);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // USER LOGIN HANDLER
  const login = useCallback(async (email: string, password: string) => {
    await axios.post(`${API_URL}/users/login`, {
      email,
      password,
    });
    setSession(null);
    dispatch({ type: "LOGIN", payload: { user: null } });
  }, []);

  // USER REGISTER HANDLER
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await axios.post(`${API_URL}/users`, {
        name,
        email,
        password,
      });
      setSession(null);
      dispatch({ type: "REGISTER", payload: { user: null } });
    },
    [],
  );

  // USER LOGOUT HANDLER
  const logout = () => {
    setSession(null);
    dispatch({ type: "LOGOUT" });
  };

  useEffect(() => {
    (async () => {
      try {
        // Legacy localStorage token is no longer supported; mark unauthenticated
        dispatch({
          type: "INIT",
          payload: { user: null, isAuthenticated: false },
        });
      } catch (err) {
        // console.error(err);
        dispatch({
          type: "INIT",
          payload: { user: null, isAuthenticated: false },
        });
      }
    })();
  }, []);

  // show loading until not initialized
  if (!state.isInitialized) return <LoadingProgress />;

  return (
    <AuthContext.Provider
      value={{ ...state, method: "JWT", login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
