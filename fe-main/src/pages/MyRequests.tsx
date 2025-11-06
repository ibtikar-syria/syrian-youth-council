import { useState, useEffect } from 'react';
import api from '../services/api';

interface Request {
  id: number;
  title: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  tags: Array<{ tagName: string; tagNameAr: string }>;
}

const MyRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/requests/my-requests');
      setRequests(response.data.requests);
    } catch (err: any) {
      setError('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'analyzing':
        return 'جاري التحليل';
      case 'grouped':
        return 'تم التجميع';
      case 'responded':
        return 'تم الرد';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'grouped':
        return 'bg-purple-100 text-purple-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">طلباتي</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 text-lg mb-4">لم ترسل أي طلبات بعد</p>
          <a
            href="/create-request"
            className="inline-block bg-[#06332c] text-white px-6 py-2 rounded-md hover:bg-[#0a4a40]"
          >
            إرسال طلب جديد
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{request.title}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">{request.content}</p>

              {request.tags && request.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {request.tags.map((tag, idx) => (
                    <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                      {tag.tagNameAr}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-gray-500 text-sm">
                تاريخ الإرسال: {new Date(request.createdAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
