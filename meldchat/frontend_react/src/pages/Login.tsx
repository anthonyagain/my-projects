import { useState } from "react";
import { useRegisterUser } from "../services";
import { Link, useNavigate } from "react-router-dom";
import { MeldChatLogo } from "../components";

import { colors } from '../components';


import downArrowWhite from "../assets/heroicons/down-arrow-white.svg";


export function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const { mutate: registerUser, isLoading, error: apiError } = useRegisterUser({
    onSuccess: () => {
      navigate("/app/");
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.password) newErrors.password = "Password is required.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Prepare data for submission
    const userData = {
      email: formData.email,
      password: formData.password,
    };

    // Call the register API
    registerUser(userData);
  };

  const allErrorsEmpty = Object.values(errors).every(error => error === "");

  return (
    <div style={{ backgroundColor: colors.registerPageBG }} className="h-full bg-sky-800 flex items-center justify-center">
      <MeldChatLogo />
      <div
        style={{ backgroundColor: colors.registerPageFormBG }}
        className="p-8 rounded-lg w-full max-w-md shadow-lg"
      >
        <h1 className="text-2xl text-white font-bold mb-6 text-center">Welcome back!</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col">
            <label style={{ color: colors.registerPageFormLabel }} className="text-sm">Email</label>
            {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="p-2 rounded text-white mt-1 border focus:outline-none"
              style={{ backgroundColor: colors.registerPageFormInputBG, borderColor: colors.registerPageFormInputBorder }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.registerPageFormInputBorderFocus;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.registerPageFormInputBorder;
              }}
            />
          </div>




          {/* Password */}
          <div className="flex flex-col">
            <label style={{ color: colors.registerPageFormLabel }} className="text-sm">Password</label>
            {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="p-2 rounded text-white mt-1 border focus:outline-none"
              style={{ backgroundColor: colors.registerPageFormInputBG, borderColor: colors.registerPageFormInputBorder }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.registerPageFormInputBorderFocus;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.registerPageFormInputBorder;
              }}
            />
          </div>


          {/* API Errors */}
          {apiError && allErrorsEmpty && <p className="text-red-500 text-sm mt-4">Login request failed. Please try again later.</p>}

          {/* Submit Button */}


          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded font-medium
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
              ${apiError && allErrorsEmpty ? '!mt-2' : ''}`}
          >
            {isLoading ? "Loading..." : "Log In"}
          </button>
        </form>

        <p className="text-sm mt-4" style={{ color: colors.registerPageFormLabel }}>
          Need an account?
          <Link to="/app/register" style={{ color: colors.textLink }} className="hover:underline text-sm inline ml-1">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};
