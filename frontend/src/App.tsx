import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { UserProvider } from "./UserContext";

// Import your pages here
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
