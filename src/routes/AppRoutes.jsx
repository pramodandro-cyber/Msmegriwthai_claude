import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { AdminPage, AssessmentPage, AuthPage, C, DashboardPage, HomePage, Nav, PricingPage, ReportPage } from "../pages/AppPages";

const PATH_BY_PAGE = {
  home: "/",
  pricing: "/pricing",
  signin: "/signin",
  signup: "/signup",
  assessment: "/assessment",
  report: "/report",
  dashboard: "/dashboard",
  admin: "/admin",
};

const PAGE_BY_PATH = Object.fromEntries(Object.entries(PATH_BY_PAGE).map(([k, v]) => [v, k]));

export default function AppRoutes() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [report, setReport] = useState(null);
  const [authState, setAuthState] = useState(false);

  const page = useMemo(() => PAGE_BY_PATH[pathname] || "home", [pathname]);

  const nav = (nextPage) => {
    navigate(PATH_BY_PAGE[nextPage] || "/");
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ fontFamily: '"Inter",system-ui,sans-serif', background: "#f8fafc", minHeight: "100vh", color: C.text }}>
      <Nav page={page} nav={nav} authState={authState} setAuthState={setAuthState} />
      <Routes>
        <Route path="/" element={<HomePage nav={nav} />} />
        <Route path="/pricing" element={<PricingPage nav={nav} />} />
        <Route path="/signin" element={<AuthPage mode="signin" nav={nav} setAuthState={setAuthState} />} />
        <Route path="/signup" element={<AuthPage mode="signup" nav={nav} setAuthState={setAuthState} />} />
        <Route path="/assessment" element={<AssessmentPage nav={nav} setReport={setReport} />} />
        <Route path="/report" element={<ReportPage report={report} nav={nav} />} />
        <Route path="/dashboard" element={<DashboardPage nav={nav} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
