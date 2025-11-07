import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

const Layout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b border-[#b9a779]/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-4 sm:space-x-6">
              <Link to="/" className="flex items-center space-x-reverse space-x-2" onClick={closeMobileMenu}>
                <span className="text-lg sm:text-xl md:text-2xl font-bold bg-linear-to-r from-[#06332c] to-[#0a4a40] bg-clip-text text-transparent">
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

            <div className="flex items-center space-x-reverse space-x-2 sm:space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="hidden sm:block text-gray-700 font-medium px-2 sm:px-3 py-2 text-sm sm:text-base">
                    مرحباً، {user?.name}
                  </span>
                  <button
                    onClick={logout}
                    className="hidden sm:block bg-[#8b4513] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#a0522d] transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    تسجيل الخروج
                  </button>
                  
                  {/* Mobile menu button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-[#b9a779]/10 transition-all duration-200"
                    aria-label="القائمة"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium text-sm sm:text-base"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:block bg-linear-to-r from-[#06332c] to-[#0a4a40] text-white px-3 sm:px-4 py-2 rounded-lg hover:from-[#0a4a40] hover:to-[#06332c] transition-all duration-200 font-medium shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {isAuthenticated && mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link 
                to="/dashboard" 
                className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                onClick={closeMobileMenu}
              >
                لوحة التحكم
              </Link>
              <Link 
                to="/my-requests" 
                className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                onClick={closeMobileMenu}
              >
                طلباتي
              </Link>
              <Link 
                to="/create-request" 
                className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                onClick={closeMobileMenu}
              >
                طلب جديد
              </Link>
              
              {(user?.role === 'admin' || user?.role === 'ministry_staff') && (
                <Link 
                  to="/view-requests" 
                  className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                  onClick={closeMobileMenu}
                >
                  عرض الطلبات
                </Link>
              )}
              
              {user?.role === 'admin' && (
                <>
                  <Link 
                    to="/manage-tags" 
                    className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                    onClick={closeMobileMenu}
                  >
                    إدارة الوسوم
                  </Link>
                  <Link 
                    to="/manage-users" 
                    className="block px-4 py-2 rounded-lg text-gray-700 hover:text-[#06332c] hover:bg-[#b9a779]/10 transition-all duration-200 font-medium"
                    onClick={closeMobileMenu}
                  >
                    إدارة المستخدمين
                  </Link>
                </>
              )}
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="px-4 py-2 text-gray-600 text-sm">
                  {user?.name}
                </div>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="w-full text-right px-4 py-2 rounded-lg text-[#8b4513] hover:bg-[#8b4513]/10 transition-all duration-200 font-medium"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
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
