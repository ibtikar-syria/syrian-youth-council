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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">إدارة المستخدمين</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) handleCancelEdit();
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'إلغاء' : 'إضافة مستخدم جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {editingUser ? 'تعديل المستخدم' : 'مستخدم جديد'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
                required={!editingUser}
                minLength={8}
                placeholder={editingUser ? 'اتركه فارغاً للإبقاء على الحالي' : ''}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">الدور</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              >
                <option value="basic_user">مستخدم عادي</option>
                <option value="youth_leader">قائد شبابي</option>
                <option value="ministry_staff">موظف الوزارة</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {editingUser ? 'تحديث' : 'إضافة'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">الاسم</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">البريد</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">الدور</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">الحالة</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm">{user.name}</td>
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">{getRoleName(user.role)}</td>
                <td className="px-6 py-4 text-sm">
                  {user.isVerified ? '✓ موثق' : '✗ غير موثق'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    حذف
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
