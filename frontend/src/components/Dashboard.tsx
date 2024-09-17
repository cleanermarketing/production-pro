import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardContent from "./DashboardContent";

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
