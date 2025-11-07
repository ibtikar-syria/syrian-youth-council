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
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">إرسال طلب جديد</h1>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm sm:text-base">نوع الطلب</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c] text-sm sm:text-base"
            >
              <option value="public_request">طلب عام</option>
              <option value="direct_request">طلب مباشر (للقيادات الشبابية)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 text-sm sm:text-base">عنوان الطلب</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c] text-sm sm:text-base"
              placeholder="اكتب عنواناً واضحاً لطلبك"
              required
              minLength={5}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 text-sm sm:text-base">محتوى الطلب</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#06332c] h-40 sm:h-48 text-sm sm:text-base"
              placeholder="اشرح طلبك بالتفصيل..."
              required
              minLength={20}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#06332c] text-white py-2.5 sm:py-3 rounded-md hover:bg-[#0a4a40] disabled:bg-gray-400 text-sm sm:text-base font-medium"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
