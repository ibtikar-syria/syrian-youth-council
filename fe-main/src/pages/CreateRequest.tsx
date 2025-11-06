import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateRequest = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('public_request');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/requests', { title, content, type });
      setSuccess('تم إرسال الطلب بنجاح! سيتم تحليله بواسطة الذكاء الاصطناعي.');
      setTitle('');
      setContent('');
      
      setTimeout(() => {
        navigate('/my-requests');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">إرسال طلب جديد</h1>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">نوع الطلب</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c]"
            >
              <option value="public_request">طلب عام</option>
              <option value="direct_request">طلب مباشر (للقيادات الشبابية)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">عنوان الطلب</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c]"
              placeholder="اكتب عنواناً واضحاً لطلبك"
              required
              minLength={5}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">محتوى الطلب</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c] h-48"
              placeholder="اشرح طلبك بالتفصيل..."
              required
              minLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06332c] text-white py-3 rounded-md hover:bg-[#0a4a40] disabled:bg-gray-400"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
