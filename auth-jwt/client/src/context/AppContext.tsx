import axios from "axios";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

// Define the user data type (Replace `any` with a specific type)
type UserDataType = any;

// Define the context value type
interface AppContextType {
  backendUrl: string;
  isLoggedin: boolean;
  setIsLoggedin: Dispatch<SetStateAction<boolean>>;
  userData: UserDataType | null;
  setUserData: Dispatch<SetStateAction<UserDataType | null>>;
  getUserData: () => Promise<void>; // Add function type
}

// Create context with default value (set to `null` initially)
export const AppContent = createContext<AppContextType | null>(null);

// Define the props type for the provider
interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {

    axios.defaults.withCredentials =true;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedin, setIsLoggedin] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserDataType | null>(null);

  
  const getAuthState = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`);

      if (data.success) {
        setIsLoggedin(true);
        getUserData();
      } else {
        setIsLoggedin(false); // Optional, depending on how you want to handle failed auth
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Auth Error:", error);
    }
  };

  interface AuthResponse {
    success: boolean;
    message?: string;
    userData?: UserDataType;
  }

  const getUserData = async () => {
    try {
      const response = await axios.get<AuthResponse>(
        `${backendUrl}/api/user/data`
      );

      if (response.data.success) {
        setUserData(response.data.userData);
      } else {
        toast.error(response.data.message || "An error occurred.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Auth Error:", error);
    }
  };

  // Ensure `getAuthState` runs on component mount
  useEffect(() => {
    getAuthState();
  }, []);

  const value: AppContextType = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData, // Include the function in context
  };

  return <AppContent.Provider value={value}>{children}</AppContent.Provider>;
};
