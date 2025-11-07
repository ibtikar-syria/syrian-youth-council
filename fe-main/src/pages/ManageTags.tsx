import { useState, useEffect } from 'react';
import api from '../services/api';

interface Tag {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  createdBy: string;
}

const ManageTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data.tags);
    } catch (err) {
      console.error('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tags', { name, nameAr, description });
      alert('تم إضافة الوسم بنجاح');
      setShowForm(false);
      setName('');
      setNameAr('');
      setDescription('');
      fetchTags();
    } catch (err: any) {
      alert(err.response?.data?.error || 'فشل إضافة الوسم');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوسم؟')) return;
    
    try {
      await api.delete(`/tags/${id}`);
      alert('تم حذف الوسم بنجاح');
      fetchTags();
    } catch (err) {
      alert('فشل حذف الوسم');
    }
  };

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold">إدارة الوسوم</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
        >
          {showForm ? 'إلغاء' : 'إضافة وسم جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">وسم جديد</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">الاسم (English)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">الاسم (العربية)</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md text-sm sm:text-base"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm sm:text-base">الوصف (اختياري)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md h-20 sm:h-24 text-sm sm:text-base"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
            >
              إضافة
            </button>
          </form>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div key={tag.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg sm:text-xl font-bold">{tag.nameAr}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded whitespace-nowrap">
                {tag.createdBy === 'ai' ? 'AI' : 'مدير'}
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm mb-2">{tag.name}</p>
            {tag.description && (
              <p className="text-gray-700 text-xs sm:text-sm mb-4">{tag.description}</p>
            )}
            <button
              onClick={() => handleDelete(tag.id)}
              className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
            >
              حذف
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageTags;
