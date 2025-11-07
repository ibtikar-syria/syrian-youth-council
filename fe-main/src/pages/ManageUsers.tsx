import { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('basic_user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/users/${editingUser.id}`, { name, email, role });
        alert('تم تحديث المستخدم بنجاح');
      } else {
        // Create new user
        await api.post('/users', { name, email, password, role });
        alert('تم إضافة المستخدم بنجاح');
      }
      setShowForm(false);
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole('basic_user');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'فشلت العملية');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('basic_user');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
      await api.delete(`/users/${id}`);
      alert('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (err) {
      alert('فشل حذف المستخدم');
    }
  };

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

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold">إدارة المستخدمين</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) handleCancelEdit();
          }}
          className="w-full sm:w-auto bg-[#06332c] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#0a4a40] text-sm sm:text-base"
        >
          {showForm ? 'إلغاء' : 'إضافة مستخدم جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            {editingUser ? 'تعديل المستخدم' : 'مستخدم جديد'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
                required={!editingUser}
                minLength={8}
                placeholder={editingUser ? 'اتركه فارغاً للإبقاء على الحالي' : ''}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">الدور</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
              >
                <option value="basic_user">مستخدم عادي</option>
                <option value="youth_leader">قائد شبابي</option>
                <option value="ministry_staff">موظف الوزارة</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-[#06332c] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#0a4a40] text-sm sm:text-base"
            >
              {editingUser ? 'تحديث' : 'إضافة'}
            </button>
          </form>
        </div>
      )}

      {/* Mobile cards view */}
      <div className="block sm:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="space-y-2 mb-3">
              <p className="text-sm"><strong>الاسم:</strong> {user.name}</p>
              <p className="text-sm break-words"><strong>البريد:</strong> {user.email}</p>
              <p className="text-sm"><strong>الدور:</strong> {getRoleName(user.role)}</p>
              <p className="text-sm">
                <strong>الحالة:</strong> {user.isVerified ? '✓ موثق' : '✗ غير موثق'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(user)}
                className="flex-1 text-[#06332c] hover:text-[#0a4a40] text-sm py-2 border border-[#06332c] rounded"
              >
                عرض التفاصيل
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="flex-1 text-[#8b4513] hover:text-[#a0522d] text-sm py-2 border border-[#8b4513] rounded"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-gray-700">الاسم</th>
              <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-gray-700">البريد</th>
              <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-gray-700">الدور</th>
              <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
              <th className="px-4 md:px-6 py-3 text-right text-sm font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 md:px-6 py-4 text-sm">{user.name}</td>
                <td className="px-4 md:px-6 py-4 text-sm break-words">{user.email}</td>
                <td className="px-4 md:px-6 py-4 text-sm">{getRoleName(user.role)}</td>
                <td className="px-4 md:px-6 py-4 text-sm">
                  {user.isVerified ? '✓ موثق' : '✗ غير موثق'}
                </td>
                <td className="px-4 md:px-6 py-4 text-sm">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-[#06332c] hover:text-[#0a4a40] mr-4"
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-[#8b4513] hover:text-[#a0522d]"
                  >
                    🗑️ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
