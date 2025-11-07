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
  response?: {
    id: number;
    content: string;
    createdAt: number;
    isPersonalized: number;
  };
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

              <p className="text-gray-500 text-sm mb-4">
                تاريخ الإرسال: {new Date(request.createdAt).toLocaleDateString('ar-SA')}
              </p>

              {request.response && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-green-700 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      الرد من الوزارة
                    </h4>
                    {request.response.isPersonalized === 1 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        رد مخصص
                      </span>
                    )}
                  </div>
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="text-gray-800 whitespace-pre-wrap">{request.response.content}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      تاريخ الرد: {new Date(request.response.createdAt * 1000).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
