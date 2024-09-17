import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaChartBar,
  FaCog,
  FaSearch,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import logo from "../logowhite.svg";
import { useUser } from "../UserContext"; // Import useUser hook

const Sidebar: React.FC = () => {
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMinified, setIsMinified] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { isClockedIn } = useUser(); // Use the isClockedIn state from UserContext

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (isClockedIn) {
      const confirmLogout = window.confirm(
        "You are still clocked in. Are you sure you want to log out?"
      );
      if (!confirmLogout) {
        return; // If user selects "No", do nothing and return
      }
    }

    // If user is not clocked in or selects "Yes", proceed with logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleExpand = (itemPath: string[]) => {
    setExpandedItems((prev) => {
      const itemPathString = itemPath.join("/");
      if (prev.includes(itemPathString)) {
        return prev.filter((item) => !item.startsWith(itemPathString));
      } else {
        return [...prev, itemPathString];
      }
    });
  };

  const toggleMinify = () => {
    if (!isMobile) {
      setIsMinified(!isMinified);
    }
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderMenuItem = (item: any, parentPath: string[] = []) => {
    if (item.roles && !item.roles.includes(user.role)) {
      return null;
    }

    const currentPath = [...parentPath, item.name];
    const isExpanded = expandedItems.includes(currentPath.join("/"));

    return (
      <div key={currentPath.join("/")}>
        <button
          onClick={() => {
            if (item.subItems) {
              toggleExpand(currentPath);
            } else {
              navigate(item.path);
              closeMobileMenu();
            }
          }}
          className={`w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${
            parentPath.length > 0 ? `pl-${8 + parentPath.length * 4}` : ""
          } ${isMinified && parentPath.length === 0 ? "flex justify-center" : ""}`}
        >
          {item.icon && <item.icon className={`inline-block ${isMinified && parentPath.length === 0 ? "" : "mr-3"}`} />}
          {(!isMinified || parentPath.length > 0) && (
            <span className={parentPath.length > 0 ? "text-sm" : ""}>
              {item.name}
            </span>
          )}
          {!isMinified && item.subItems && (
            <span className="float-right">
              {isExpanded ? (
                <FaChevronUp className="mt-1" />
              ) : (
                <FaChevronDown className="mt-1" />
              )}
            </span>
          )}
        </button>
        {isExpanded && item.subItems && !isMinified && (
          <div>
            {item.subItems.map((subItem: any) =>
              renderMenuItem(subItem, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  const menuItems = [
    {
      name: "Production",
      icon: FaClipboardList,
      path: "/dashboard/production",
      roles: ["employee", "manager", "admin"],
    },
    {
      name: "Inspection",
      icon: FaSearch,
      path: "/dashboard/inspection",
      roles: ["manager", "admin"],
    },
    {
      name: "Dashboards",
      icon: FaChartBar,
      roles: ["manager", "admin"],
      subItems: [
        {
          name: "Production Efficiency",
          path: "/dashboard/real-time/production-efficiency",
        },
        {
          name: "Production Volumes",
          path: "/dashboard/real-time/production-volumes",
        },
      ],
    },
    {
      name: "Reporting",
      icon: FaChartBar,
      roles: ["manager", "admin"],
      subItems: [
        {
          name: "Productivity",
          subItems: [
            {
              name: "Productivity by Employee",
              path: "/dashboard/reporting/productivity-by-employee",
            },
          ],
        },
        {
          name: "Financial",
          roles: ["admin"], // Add this line to restrict access to admin only
          subItems: [],
        },
        {
          name: "Time",
          subItems: [
            {
              name: "Today's Timeclocks",
              path: "/dashboard/reports/todays-timeclocks",
            },
            {
              name: "Weekly Timecards",
              path: "/dashboard/reports/weekly-timecards",
            },
          ],
        },
      ],
    },
    {
      name: "Admin",
      icon: FaCog,
      roles: ["admin"],
      subItems: [
        {
          name: "Jobs",
          subItems: [
            {
              name: "Add New Jobs",
              path: "/dashboard/admin/jobs/add",
            },
            {
              name: "Edit Jobs",
              path: "/dashboard/admin/jobs/edit",
            },
          ],
        },
        {
          name: "Users",
          subItems: [
            {
              name: "Add New Users",
              path: "/dashboard/admin/users/add",
            },
            {
              name: "Edit Users",
              path: "/dashboard/admin/users/edit",
            },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50 mobile-menu-button">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white bg-gray-800 p-2 rounded"
        >
          <FaBars />
        </button>
      </div>
      <div
        className={`bg-gray-900 text-gray-300 ${
          isMinified && !isMobile ? "w-16" : "w-64"
        } space-y-2 py-7 px-2 h-screen flex flex-col transition-all duration-300 ease-in-out
        ${
          isMobile
            ? isMobileMenuOpen
              ? "fixed inset-y-0 left-0 z-40 mobile-menu"
              : "hidden"
            : "flex"
        }`}
      >
        <div className="mb-8 px-4 flex justify-center">
          {!isMinified && (
            <img
              src={logo}
              alt="Logo"
              className="w-full max-w-[200px] h-auto px-4 py-2"
            />
          )}
        </div>
        <nav className="flex-grow space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
        <button
          onClick={() => {
            handleLogout();
            closeMobileMenu();
          }}
          className={`w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 mt-auto ${
            isMinified && !isMobile ? "flex justify-center" : ""
          }`}
        >
          <FaSignOutAlt className={`inline-block ${isMinified && !isMobile ? "" : "mr-3"}`} />
          {(!isMinified || isMobile) && "Logout"}
        </button>
        {!isMobile && (
          <button
            onClick={toggleMinify}
            className="w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 mt-2"
          >
            {isMinified ? (
              <FaChevronRight className="inline-block mx-auto" />
            ) : (
              <>
                <FaChevronLeft className="inline-block mr-3" />
                Minify Menu
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default Sidebar;
