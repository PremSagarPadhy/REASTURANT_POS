import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, Analytics} from "./pages";
import Payments from "./components/dashboard/Payments";
import Inventory from "./components/dashboard/Inventory"; // Import the Inventory component
import Header from "./components/shared/Header";
import Sidebar from "./components/shared/Sidebar";
import Notification from "./components/shared/Notification"; // Import the Notification component
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import { SidebarProvider } from "./context/SidebarContext";
import { NotificationProvider } from "./context/NotificationContext"; // Fixed import path

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const showSidebar = location.pathname.includes("/dashboard") || location.pathname.includes("/inventory"); // Added inventory path
  const hideHeaderRoutes = ["/auth"];
  const { isAuth } = useSelector((state) => state.user);

  if (isLoading) return <FullScreenLoader />;

  return (
    <div className="flex">
      {/* Show Sidebar on dashboard and its subroutes */}
      {showSidebar && <Sidebar />}

      <div className="flex-1">
        {!hideHeaderRoutes.includes(location.pathname) && <Header />}
        <Notification /> {/* Add the Notification component */}
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
          {/* Add the route for Inventory */}
          <Route path="/inventory" element={<ProtectedRoutes><Inventory /></ProtectedRoutes>}/>
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
    <NotificationProvider> {/* Wrap the app with NotificationProvider */}
      <SidebarProvider>
        <Router>
          <Layout />
        </Router>
      </SidebarProvider>
    </NotificationProvider>
  );
}

export default App;
