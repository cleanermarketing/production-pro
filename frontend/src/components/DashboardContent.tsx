import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Production from "./Production";
import RealTimeDashboards from "./RealTimeDashboards";
import Reporting from "./Reporting";
import Admin from "./Admin";
import Inspection from "./Inspection";
import AddNewJobs from "./admin/AddNewJobs";
import EditJobs from "./admin/EditJobs";
import AddNewUsers from "./admin/AddNewUsers";
import EditUsers from "./admin/EditUsers";
import ProductionEfficiencyDashboard from "./ProductionEfficiencyDashboard";
import ProductionVolumesDashboard from "./ProductionVolumesDashboard";
import ProductivityByEmployeeReport from "./ProductivityByEmployeeReport";
import TodaysTimeclocks from "./reports/TodaysTimeclocks";
import WeeklyTimecards from "./reports/WeeklyTimecards";

const DashboardContent: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/dashboard/production" replace />}
      />
      <Route path="/production" element={<Production />} />
      <Route path="/inspection" element={<Inspection />} />
      <Route path="/real-time" element={<RealTimeDashboards />} />
      <Route path="/reporting" element={<Reporting />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/jobs/add" element={<AddNewJobs />} />
      <Route path="/admin/jobs/edit" element={<EditJobs />} />
      <Route path="/admin/users/add" element={<AddNewUsers />} />
      <Route path="/admin/users/edit" element={<EditUsers />} />
      <Route
        path="/real-time/production-efficiency"
        element={<ProductionEfficiencyDashboard />}
      />
      <Route
        path="/real-time/production-volumes"
        element={<ProductionVolumesDashboard />}
      />
      <Route
        path="/reporting/productivity-by-employee"
        element={<ProductivityByEmployeeReport />}
      />
      <Route path="/reports/todays-timeclocks" element={<TodaysTimeclocks />} />
      <Route path="/reports/weekly-timecards" element={<WeeklyTimecards />} />
    </Routes>
  );
};

export default DashboardContent;
