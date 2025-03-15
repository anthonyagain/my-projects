import { useState } from "react";
import { useRegisterUser } from "../services";
import { Link, useNavigate } from "react-router-dom";
import { MeldChatLogo } from "../components";

import { colors } from '../components';


import downArrowWhite from "../assets/heroicons/down-arrow-white.svg";


export function Register() {
  // const [formData, setFormData] = useState({
  //   email: "test@test.com",
  //   displayName: "test",
  //   username: "test",
  //   password: "test123",
  //   month: "1",
  //   day: "1",
  //   year: "1990",
  // });
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    username: "",
    password: "",
    month: "",
    day: "",
    year: "",
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
    // Clear errors when user starts typing
    // if (errors[name]) {
    //   setErrors({ ...errors, [name]: "" });
    // }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required.";
    if (!formData.username) newErrors.username = "Username is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    if (!formData.month || !formData.day || !formData.year)
      newErrors.date_of_birth = "Date of birth is required.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Prepare data for submission
    const userData = {
      email: formData.email,
      display_name: formData.displayName,
      username: formData.username,
      password: formData.password,
      date_of_birth: `${formData.year}-${formData.month}-${formData.day}`,
    };

    // Call the register API
    registerUser(userData);
  };

  // Generate options for date picker
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const allErrorsEmpty = Object.values(errors).every(error => error === "");

  return (
    <div style={{ backgroundColor: colors.registerPageBG }} className="h-full bg-sky-800 flex items-center justify-center">
      <MeldChatLogo />
      <div
        style={{ backgroundColor: colors.registerPageFormBG }}
        className="p-8 rounded-lg w-full max-w-md shadow-lg"
      >
        <h1 className="text-2xl text-white font-bold mb-6 text-center">Create an account</h1>

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

          {/* Display Name */}
          <div className="flex flex-col">
            <label style={{ color: colors.registerPageFormLabel }} className="text-sm">Display Name (optional)</label>
            {errors.displayName && <span className="text-red-500 text-sm">{errors.displayName}</span>}
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
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

          {/* Username */}
          <div className="flex flex-col">
            <label style={{ color: colors.registerPageFormLabel }} className="text-sm">Username</label>
            {errors.username && <span className="text-red-500 text-sm">{errors.username}</span>}
            <input
              type="text"
              name="username"
              value={formData.username}
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

          {/* Date of Birth */}
          <div className="flex flex-col">
            <label style={{ color: colors.registerPageFormLabel }} className="text-sm">Date of Birth</label>
            {errors.date_of_birth && <span className="text-red-500 text-sm">{errors.date_of_birth}</span>}
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  className="py-2 px-3 rounded text-white w-full appearance-none pr-10 border focus:outline-none"
                  style={{ backgroundColor: colors.registerPageFormInputBG, borderColor: colors.registerPageFormInputBorder }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorderFocus;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorder;
                  }}
                >
                  <option value="">Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <img
                  src={downArrowWhite}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4"
                />
              </div>
              <div className="relative flex-1">
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  className="py-2 px-3 rounded text-white w-full appearance-none pr-10 border focus:outline-none"
                  style={{ backgroundColor: colors.registerPageFormInputBG, borderColor: colors.registerPageFormInputBorder }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorderFocus;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorder;
                  }}
                >
                  <option value="">Day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <img
                  src={downArrowWhite}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4"
                />
              </div>
              <div className="relative flex-1">
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="py-2 px-3 rounded text-white w-full appearance-none pr-10 border focus:outline-none"
                  style={{ backgroundColor: colors.registerPageFormInputBG, borderColor: colors.registerPageFormInputBorder }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorderFocus;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.registerPageFormInputBorder;
                  }}
                >
                  <option value="">Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <img
                  src={downArrowWhite}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4"
                />
              </div>
            </div>
          </div>

          {/* API Errors */}
          {apiError && allErrorsEmpty && <p className="text-red-500 text-sm mt-4">Registration request failed. Please try again later.</p>}

          {/* Submit Button */}


          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white p-3 rounded font-medium
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
              ${apiError && allErrorsEmpty ? '!mt-2' : ''}`}
            style={{ backgroundColor: colors.registerPageSubmitBtn }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.registerPageSubmitBtnHover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.registerPageSubmitBtn;
            }}
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>
        </form>

        <p style={{ color: colors.registerPageTosText }} className="text-xs mt-4">
          By registering, you agree to MeldChat's{" "}
          <a href="/terms-of-service" style={{ color: colors.textLinkDark }} className="hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy-policy" style={{ color: colors.textLinkDark }} className="hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <Link to="/app/login" style={{ color: colors.textLink }} className="hover:underline text-sm block mt-4">
          Already have an account?
        </Link>
      </div>
    </div>
  );
};
