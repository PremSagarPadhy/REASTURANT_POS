import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, Support} from "./pages";
import {Payments, Inventory, EmployeeAttendance, AdminSupport, EmployeeAdd, EmployeeDetails, EmployeeEdit, Analytics} from "./components/dashboard";
import {Sidebar, Header, FullScreenLoader, Notification} from "./components/shared";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import { SidebarProvider } from "./context/SidebarContext";


function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  
  // Only call useLoadData when NOT on auth page
  const isLoading = isAuthPage ? false : useLoadData();
  
  const showSidebar = location.pathname.includes("/dashboard") || 
                      location.pathname.includes("/inventory") || 
                      location.pathname.includes("/admin-support") ||
                      location.pathname.includes("/employees") ||
                      location.pathname.includes("/employee-add") ||
                      location.pathname.includes("/employee-edit") ||
                      location.pathname.includes("/attendance")
  const hideHeaderRoutes = ["/auth"];
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  return (
    <div className="flex">
      {/* Show Sidebar on dashboard and its subroutes */}
      {showSidebar && <Sidebar />}

      <div className="flex-1">
        {!hideHeaderRoutes.includes(location.pathname) && <Header />}
        <Notification /> 
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoutes>
                <Home />
              </ProtectedRoutes>
            }
          />
          <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />
          <Route path="/orders" element={<ProtectedRoutes><Orders /></ProtectedRoutes>}/>
          <Route path="/tables" element={<ProtectedRoutes><Tables /></ProtectedRoutes>}/>
          <Route path="/menu" element={<ProtectedRoutes><Menu /></ProtectedRoutes>}/>
          <Route path="/dashboard" element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>}/>
          <Route path="/analytics" element={<ProtectedRoutes><Analytics /></ProtectedRoutes>} />
          <Route path="/payments/list" element={<ProtectedRoutes><Payments /></ProtectedRoutes>}/>
          <Route path="/inventory" element={<ProtectedRoutes><Inventory /></ProtectedRoutes>}/>
          <Route path="/support" element={<Support />} />
          <Route path="/AdminSupport" element={<ProtectedRoutes><AdminSupport /></ProtectedRoutes>} />
          <Route path="/employees" element={<ProtectedRoutes><EmployeeDetails /></ProtectedRoutes>} />
          <Route path="/employee-add" element={<ProtectedRoutes><EmployeeAdd /></ProtectedRoutes>} />
          <Route path="/employee-edit/:id" element={<ProtectedRoutes><EmployeeEdit /></ProtectedRoutes>} />
          <Route path="/attendance" element={<ProtectedRoutes><EmployeeAttendance /></ProtectedRoutes>} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }
  return children;
}

function App() {
  return (
      <SidebarProvider>
        <Router>
          <Layout />
        </Router>
      </SidebarProvider>
  );
}

export default App;
