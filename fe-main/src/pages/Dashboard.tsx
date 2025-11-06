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
    <div>
      <h1 className="text-4xl font-bold mb-6">لوحة التحكم</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">معلومات الحساب</h2>
        <p className="text-gray-700">
          <strong>الاسم:</strong> {user?.name}
        </p>
        <p className="text-gray-700">
          <strong>البريد الإلكتروني:</strong> {user?.email}
        </p>
        <p className="text-gray-700">
          <strong>الدور:</strong> {user && getRoleName(user.role)}
        </p>
        <p className="text-gray-700">
          <strong>الحالة:</strong> {user?.isVerified ? 'موثق ✓' : 'غير موثق'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/my-requests"
          className="bg-blue-500 text-white p-6 rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          <h3 className="text-xl font-bold mb-2">طلباتي</h3>
          <p>عرض وإدارة طلباتك</p>
        </Link>

        <Link
          to="/create-request"
          className="bg-green-500 text-white p-6 rounded-lg shadow-md hover:bg-green-600 transition"
        >
          <h3 className="text-xl font-bold mb-2">طلب جديد</h3>
          <p>إرسال طلب جديد للوزارة</p>
        </Link>

        {(user?.role === 'admin' || user?.role === 'ministry_staff') && (
          <Link
            to="/view-requests"
            className="bg-purple-500 text-white p-6 rounded-lg shadow-md hover:bg-purple-600 transition"
          >
            <h3 className="text-xl font-bold mb-2">عرض الطلبات</h3>
            <p>مراجعة والرد على الطلبات</p>
          </Link>
        )}

        {user?.role === 'admin' && (
          <>
            <Link
              to="/manage-tags"
              className="bg-orange-500 text-white p-6 rounded-lg shadow-md hover:bg-orange-600 transition"
            >
              <h3 className="text-xl font-bold mb-2">إدارة الوسوم</h3>
              <p>إضافة وتعديل الوسوم</p>
            </Link>

            <Link
              to="/manage-users"
              className="bg-red-500 text-white p-6 rounded-lg shadow-md hover:bg-red-600 transition"
            >
              <h3 className="text-xl font-bold mb-2">إدارة المستخدمين</h3>
              <p>إضافة وتعديل المستخدمين</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
