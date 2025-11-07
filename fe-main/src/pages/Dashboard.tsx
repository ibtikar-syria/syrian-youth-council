import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuthStore();

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'ministry_staff':
        return 'موظف الوزارة';
      case 'youth_leader':
        return 'قائد شبابي';
      case 'basic_user':
        return 'مستخدم عادي';
      default:
        return role;
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 bg-linear-to-r from-[#06332c] to-[#0a4a40] bg-clip-text text-transparent">
        لوحة التحكم
      </h1>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg mb-6 sm:mb-8 border border-[#b9a779]/30">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#06332c] flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">👤</span>
          معلومات الحساب
        </h2>
        <div className="space-y-2 sm:space-y-3">
          <p className="text-gray-700 text-base sm:text-lg break-words">
            <strong className="text-[#06332c]">الاسم:</strong> {user?.name}
          </p>
          <p className="text-gray-700 text-base sm:text-lg break-words">
            <strong className="text-[#06332c]">البريد الإلكتروني:</strong> {user?.email}
          </p>
          <p className="text-gray-700 text-base sm:text-lg">
            <strong className="text-[#06332c]">الدور:</strong> {user && getRoleName(user.role)}
          </p>
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <strong className="text-[#06332c]">الحالة:</strong> 
            {user?.isVerified ? (
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm sm:text-base">
                موثق ✓
              </span>
            ) : (
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm sm:text-base">
                غير موثق
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/my-requests"
          className="bg-linear-to-br from-[#06332c] to-[#0a4a40] text-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/50"
        >
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📋</div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">طلباتي</h3>
          <p className="text-[#b9a779] text-sm sm:text-base">عرض وإدارة طلباتك</p>
        </Link>

        <Link
          to="/create-request"
          className="bg-linear-to-br from-[#b9a779] to-[#a0916a] text-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#06332c]/30"
        >
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">✍️</div>
          <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">طلب جديد</h3>
          <p className="text-[#06332c] text-sm sm:text-base">إرسال طلب جديد للوزارة</p>
        </Link>

        {(user?.role === 'admin' || user?.role === 'ministry_staff') && (
          <Link
            to="/view-requests"
            className="bg-linear-to-br from-[#06332c] to-[#0a4a40] text-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/50"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👁️</div>
            <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">عرض الطلبات</h3>
            <p className="text-[#b9a779] text-sm sm:text-base">مراجعة والرد على الطلبات</p>
          </Link>
        )}

        {user?.role === 'admin' && (
          <>
            <Link
              to="/manage-tags"
              className="bg-linear-to-br from-[#b9a779] to-[#a0916a] text-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#06332c]/30"
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🏷️</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">إدارة الوسوم</h3>
              <p className="text-[#06332c] text-sm sm:text-base">إضافة وتعديل الوسوم</p>
            </Link>

            <Link
              to="/manage-users"
              className="bg-linear-to-br from-[#06332c] to-[#0a4a40] text-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/50"
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👥</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">إدارة المستخدمين</h3>
              <p className="text-[#b9a779] text-sm sm:text-base">إضافة وتعديل المستخدمين</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
