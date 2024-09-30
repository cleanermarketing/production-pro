import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Loading from "./Loading";

const Production = lazy(() => import("./Production"));
const Inspection = lazy(() => import("./Inspection"));
const RealTimeDashboards = lazy(() => import("./RealTimeDashboards"));
const Reporting = lazy(() => import("./Reporting"));
const Admin = lazy(() => import("./Admin"));
const AddNewJobs = lazy(() => import("./admin/AddNewJobs"));
const EditJobs = lazy(() => import("./admin/EditJobs"));
const AddNewUsers = lazy(() => import("./admin/AddNewUsers"));
const EditUsers = lazy(() => import("./admin/EditUsers"));
const ProductionEfficiencyDashboard = lazy(() => import("./ProductionEfficiencyDashboard"));
const ProductionVolumesDashboard = lazy(() => import("./ProductionVolumesDashboard"));
const ProductivityByEmployeeReport = lazy(() => import("./ProductivityByEmployeeReport"));
const TodaysTimeclocks = lazy(() => import("./reports/TodaysTimeclocks"));
const WeeklyTimecards = lazy(() => import("./reports/WeeklyTimecards"));

const DashboardContent: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/production" replace />} />
          <Route path="/production" element={<Production />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/real-time" element={<RealTimeDashboards />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/jobs/add" element={<AddNewJobs />} />
          <Route path="/admin/jobs/edit" element={<EditJobs />} />
          <Route path="/admin/users/add" element={<AddNewUsers />} />
          <Route path="/admin/users/edit" element={<EditUsers />} />
          <Route path="/real-time/production-efficiency" element={<ProductionEfficiencyDashboard />} />
          <Route path="/real-time/production-volumes" element={<ProductionVolumesDashboard />} />
          <Route path="/reporting/productivity-by-employee" element={<ProductivityByEmployeeReport />} />
          <Route path="/reports/todays-timeclocks" element={<TodaysTimeclocks />} />
          <Route path="/reports/weekly-timecards" element={<WeeklyTimecards />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default DashboardContent;
