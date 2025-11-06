import { useState, useEffect } from 'react';
import api from '../services/api';

interface Request {
  id: number;
  title: string;
  content: string;
  status: string;
  type: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  tags: Array<{ tagName: string; tagNameAr: string }>;
  groupId?: number;
}

const ViewRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests');
      setRequests(response.data.requests);
    } catch (err) {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: number) => {
    setResponding(true);
    try {
      await api.post('/responses', {
        requestId,
        content: responseText,
      });
      alert('تم إرسال الرد بنجاح');
      setSelectedRequest(null);
      setResponseText('');
      fetchRequests();
    } catch (err) {
      alert('فشل إرسال الرد');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">عرض الطلبات</h1>

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{request.title}</h3>
                <p className="text-gray-600 text-sm">
                  من: {request.userName} ({request.userEmail})
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {request.status}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{request.content}</p>

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
              {new Date(request.createdAt).toLocaleDateString('ar-SA')}
            </p>

            {request.status !== 'responded' && (
              <button
                onClick={() => setSelectedRequest(request)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                الرد على الطلب
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">الرد على الطلب</h2>
            <div className="mb-4">
              <p className="font-bold">{selectedRequest.title}</p>
              <p className="text-gray-600">{selectedRequest.content}</p>
            </div>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 h-32 mb-4"
              placeholder="اكتب ردك هنا..."
            />

            <div className="flex gap-4">
              <button
                onClick={() => handleRespond(selectedRequest.id)}
                disabled={responding || !responseText}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {responding ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setResponseText('');
                }}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRequests;
