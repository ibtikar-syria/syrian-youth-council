import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-8">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                مجلس الشباب السوري
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                    لوحة التحكم
                  </Link>
                  <Link to="/my-requests" className="text-gray-700 hover:text-blue-600">
                    طلباتي
                  </Link>
                  <Link to="/create-request" className="text-gray-700 hover:text-blue-600">
                    طلب جديد
                  </Link>
                  
                  {(user?.role === 'admin' || user?.role === 'ministry_staff') && (
                    <Link to="/view-requests" className="text-gray-700 hover:text-blue-600">
                      عرض الطلبات
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/manage-tags" className="text-gray-700 hover:text-blue-600">
                        إدارة الوسوم
                      </Link>
                      <Link to="/manage-users" className="text-gray-700 hover:text-blue-600">
                        إدارة المستخدمين
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center space-x-reverse space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700">مرحباً، {user?.name}</span>
                  <button
                    onClick={logout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center">
            © 2025 مجلس الشباب السوري - بالتعاون مع تجمع إبتكار
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
