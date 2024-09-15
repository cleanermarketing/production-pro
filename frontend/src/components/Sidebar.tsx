import React, { useState } from "react";
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
} from "react-icons/fa";
import logo from "../logowhite.svg";
import { useUser } from "../UserContext"; // Import useUser hook

const Sidebar: React.FC = () => {
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navigate = useNavigate();
  const { isClockedIn } = useUser(); // Use the isClockedIn state from UserContext

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

  const renderMenuItem = (item: any, parentPath: string[] = []) => {
    if (item.roles && !item.roles.includes(user.role)) {
      return null;
    }

    const currentPath = [...parentPath, item.name];
    const isExpanded = expandedItems.includes(currentPath.join("/"));

    return (
      <div key={currentPath.join("/")}>
        <button
          onClick={() =>
            item.subItems ? toggleExpand(currentPath) : navigate(item.path)
          }
          className={`w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 ${
            parentPath.length > 0 ? `pl-${8 + parentPath.length * 4}` : ""
          }`}
        >
          {item.icon && <item.icon className="inline-block mr-3" />}
          <span className={parentPath.length > 0 ? "text-sm" : ""}>
            {item.name}
          </span>
          {item.subItems && (
            <span className="float-right">
              {isExpanded ? (
                <FaChevronUp className="mt-1" />
              ) : (
                <FaChevronDown className="mt-1" />
              )}
            </span>
          )}
        </button>
        {isExpanded && item.subItems && (
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
    <div className="bg-gray-900 text-gray-300 w-64 space-y-2 py-7 px-2 h-screen flex flex-col">
      <div className="mb-8 px-4 flex justify-center">
        <img
          src={logo}
          alt="Logo"
          className="w-full max-w-[200px] h-auto px-4 py-2"
        />
      </div>
      <nav className="flex-grow space-y-1">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
      <button
        onClick={handleLogout}
        className="w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 mt-auto"
      >
        <FaSignOutAlt className="inline-block mr-3" />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
