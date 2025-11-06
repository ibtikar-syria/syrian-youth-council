import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b border-[#b9a779]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-6">
              <Link to="/" className="flex items-center space-x-reverse space-x-2">
                <span className="text-2xl font-bold bg-linear-to-r from-[#06332c] to-[#0a4a40] bg-clip-text text-transparent">
                  مجلس الشباب السوري
                </span>
              </Link>
              
              {isAuthenticated && (
                <div className="hidden md:flex items-center space-x-reverse space-x-1">
                  <Link 
                    to="/dashboard" 
                    className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                  >
                    لوحة التحكم
                  </Link>
                  <Link 
                    to="/my-requests" 
                    className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                  >
                    طلباتي
                  </Link>
                  <Link 
                    to="/create-request" 
                    className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                  >
                    طلب جديد
                  </Link>
                  
                  {(user?.role === 'admin' || user?.role === 'ministry_staff') && (
                    <Link 
                      to="/view-requests" 
                      className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                    >
                      عرض الطلبات
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <>
                      <Link 
                        to="/manage-tags" 
                        className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                      >
                        إدارة الوسوم
                      </Link>
                      <Link 
                        to="/manage-users" 
                        className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                      >
                        إدارة المستخدمين
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-reverse space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="hidden sm:block text-gray-700 font-medium px-3 py-2">
                    مرحباً، {user?.name}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="bg-linear-to-r from-[#06332c] to-[#0a4a40] text-white px-4 py-2 rounded-lg hover:from-[#0a4a40] hover:to-[#06332c] transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-linear-to-r from-[#06332c] to-[#0a4a40] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-lg font-medium mb-2 text-[#b9a779]">
              مجلس الشباب السوري
            </p>
            <p className="text-[#b9a779]/70 text-sm">
              © 2025 بالتعاون مع تجمع إبتكار - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
