import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyRequests from './pages/MyRequests';
import CreateRequest from './pages/CreateRequest';
import ViewRequests from './pages/ViewRequests';
import ManageTags from './pages/ManageTags';
import ManageUsers from './pages/ManageUsers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="create-request"
            element={
              <ProtectedRoute>
                <CreateRequest />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="view-requests"
            element={
              <ProtectedRoute requiredRole={['admin', 'ministry_staff']}>
                <ViewRequests />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="manage-tags"
            element={
              <ProtectedRoute requiredRole={['admin']}>
                <ManageTags />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="manage-users"
            element={
              <ProtectedRoute requiredRole={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
