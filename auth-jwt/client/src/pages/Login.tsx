import axios from "axios";
import { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";

const Login = () => {
  const navigate = useNavigate();

  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  interface AuthResponse {
    success: boolean;
    message?: string;
  }
  const onSubmitHandler = async (
    e: FormEvent<HTMLFormElement>,
    state: string,
    backendUrl: string,
    name: string,
    email: string,
    password: string,
    setIsLoggedin: (value: boolean) => void
  ) => {
    try {
      e.preventDefault();
      axios.defaults.withCredentials = true;

      let data: AuthResponse;

      if (state === "Sign Up") {
        const response = await axios.post<AuthResponse>(
          `${backendUrl}/api/auth/register`,
          {
            name,
            email,
            password,
          }
        );
        data = response.data;
      } else {
        const response = await axios.post<AuthResponse>(
          `${backendUrl}/api/auth/login`,
          {
            email,
            password,
          }
        );
        data = response.data;
      }

      if (data.success) {
        setIsLoggedin(true);
        getUserData();
        navigate("/");
      } else {
        toast.error(data.message || "An error occurred.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Auth Error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="logo"
        className=" absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />

      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm">
        <h2 className="text-3xl font-semibold text-white text-center mb-3">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>

        <p className="text-center text-sm mb-3">
          {state === "Sign Up"
            ? "Create Your Account"
            : "Login to Your Account!"}
        </p>

        <form
          onSubmit={(e) =>
            onSubmitHandler(
              e,
              state,
              backendUrl,
              name,
              email,
              password,
              setIsLoggedin
            )
          }
        >
          {state === "Sign Up" && (
            <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
              <img src={assets.person_icon} alt="" />
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="bg-transparent outline-none"
                type="text"
                placeholder="Full Name"
                required
              />
            </div>
          )}

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="" />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none"
              type="email"
              placeholder="Email id"
              required
            />
          </div>
          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.lock_icon} alt="" />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <p
            onClick={() => navigate("/reset-password")}
            className="mb-4 text-indigo-500 cursor-pointer"
          >
            Forgot password
          </p>
          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900  text-white font-medium">
            {state}
          </button>
        </form>
        {state === "Sign Up" ? (
          <p className="text-gray-400 text-center text-xs mt-4">
            Already have an account?{" "}
            <span
              onClick={() => setState("Login")}
              className="text-blue-400 cursor-pointer underline"
            >
              Login here
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-center text-xs mt-4">
            Don't have an account?{" "}
            <span
              onClick={() => setState("Sign Up")}
              className="text-blue-400 cursor-pointer underline"
            >
              Sign Up
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
