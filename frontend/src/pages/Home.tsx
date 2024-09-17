import React from "react";
import { Link } from "react-router-dom";
import logo from "../logo.svg";

const Home = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <img src={logo} alt="Company Logo" className="w-64 mb-8" />
        <div className="space-y-4">
          <Link
            to="/signin"
            className="block w-48 px-4 py-2 text-center bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="block w-48 px-4 py-2 text-center bg-green-500 text-white rounded hover:bg-green-600"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
