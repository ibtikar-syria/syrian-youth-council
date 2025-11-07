import { useState, useEffect } from 'react';
import api from '../services/api';

interface Request {
  id: string;
  title: string;
  content: string;
  status: string;
  type: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  tags: Array<{ tagName: string; tagNameAr: string }>;
  groupId?: string;
}

interface Group {
  id: string;
  title: string;
  description: string;
  requestCount: number;
  pendingCount: number;
  respondedCount: number;
  hasResponse: boolean;
  tagNameAr?: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'analyzing' | 'grouped' | 'responded';

const ViewRequestsEnhanced = () => {
  const [directRequests, setDirectRequests] = useState<Request[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupRequests, setGroupRequests] = useState<Request[]>([]);
  
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDirectRequests(), fetchGroups()]);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectRequests = async () => {
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.get('/requests', { params });
      setDirectRequests(response.data.requests);
    } catch (err) {
      console.error('Failed to fetch direct requests');
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups);
    } catch (err) {
      console.error('Failed to fetch groups');
    }
  };

  const fetchGroupDetails = async (groupId: string, forViewing: boolean = false) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setGroupRequests(response.data.group.requests);
      setSelectedGroup({
        id: response.data.group.id,
        title: response.data.group.title,
        description: response.data.group.description,
        requestCount: response.data.group.requests.length,
        pendingCount: response.data.group.requests.filter((r: Request) => r.status !== 'responded').length,
        respondedCount: response.data.group.requests.filter((r: Request) => r.status === 'responded').length,
        hasResponse: !!response.data.group.response,
        tagNameAr: response.data.group.tagNameAr,
        createdAt: response.data.group.createdAt,
      });
      
      if (forViewing) {
        setShowRequestsModal(true);
      } else {
        setShowResponseModal(true);
      }
    } catch (err) {
      alert('فشل تحميل تفاصيل المجموعة');
    }
  };

  const handleRespondToRequest = (request: Request) => {
    setSelectedRequest(request);
    setSelectedGroup(null);
    setShowResponseModal(true);
  };

  const handleRespondToGroup = (group: Group) => {
    fetchGroupDetails(group.id, false);
  };

  const handleViewGroupRequests = (group: Group) => {
    fetchGroupDetails(group.id, true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      alert('الرجاء كتابة الرد');
      return;
    }

    setResponding(true);
    try {
      if (selectedGroup) {
        await api.post('/responses', {
          groupId: selectedGroup.id,
          content: responseText,
        });
        alert('تم إرسال الرد لجميع الطلبات في المجموعة');
      } else if (selectedRequest) {
        await api.post('/responses', {
          requestId: selectedRequest.id,
          content: responseText,
        });
        alert('تم إرسال الرد بنجاح');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert('فشل إرسال الرد');
    } finally {
      setResponding(false);
    }
  };

  const handleCloseModal = () => {
    setShowResponseModal(false);
    setShowRequestsModal(false);
    setSelectedRequest(null);
    setSelectedGroup(null);
    setGroupRequests([]);
    setResponseText('');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'analyzing':
        return 'قيد التحليل';
      case 'grouped':
        return 'مجمّع';
      case 'responded':
        return 'تم الرد';
      default:
        return status;
    }
  };

  const filteredDirectRequests = directRequests.filter(req =>
    searchQuery === '' ||
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    searchQuery === '' ||
    group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">عرض الطلبات</h1>
        
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="analyzing">قيد التحليل</option>
            <option value="grouped">مجمّع</option>
            <option value="responded">تم الرد</option>
          </select>
        </div>
      </div>

      {/* Direct Requests Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">الطلبات المباشرة (من القادة الشباب)</h2>
        <div className="space-y-4">
          {filteredDirectRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">لا توجد طلبات مباشرة</div>
          ) : (
            filteredDirectRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-lg shadow-md border-r-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                        طلب مباشر
                      </span>
                      <h3 className="text-xl font-bold">{request.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      من: {request.userName} ({request.userEmail})
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{request.content}</p>

                {request.tags && request.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {request.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                        {tag.tagNameAr || tag.tagName}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-sm">
                    {new Date(request.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {request.status !== 'responded' && (
                    <button
                      onClick={() => handleRespondToRequest(request)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      الرد على الطلب
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grouped Public Requests Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">الطلبات العامة المجمعة (من الشباب)</h2>
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">لا توجد مجموعات</div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id} className="bg-white p-6 rounded-lg shadow-md border-r-4 border-purple-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                        مجموعة طلبات
                      </span>
                      <h3 className="text-xl font-bold">{group.title}</h3>
                    </div>
                    {group.description && (
                      <p className="text-gray-600 text-sm mb-2">{group.description}</p>
                    )}
                    {group.tagNameAr && (
                      <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {group.tagNameAr}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-gray-800">{group.requestCount}</div>
                    <div className="text-sm text-gray-600">إجمالي الطلبات</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-yellow-800">{group.pendingCount}</div>
                    <div className="text-sm text-yellow-600">قيد الانتظار</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-2xl font-bold text-green-800">{group.respondedCount}</div>
                    <div className="text-sm text-green-600">تم الرد</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-sm">
                    {new Date(group.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewGroupRequests(group)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                      عرض الطلبات ({group.requestCount})
                    </button>
                    {!group.hasResponse && (
                      <button
                        onClick={() => handleRespondToGroup(group)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                      >
                        الرد على المجموعة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Requests Modal */}
      {showRequestsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">طلبات المجموعة: {selectedGroup.title}</h2>

            {selectedGroup.description && (
              <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {groupRequests.map((req) => (
                <div key={req.id} className="p-4 bg-gray-50 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{req.title}</h3>
                      <p className="text-sm text-gray-600">من: {req.userName} ({req.userEmail})</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(req.status)}`}>
                      {getStatusText(req.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{req.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(req.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              {!selectedGroup.hasResponse && (
                <button
                  onClick={() => {
                    setShowRequestsModal(false);
                    setShowResponseModal(true);
                  }}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                >
                  الرد على المجموعة
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedGroup ? 'الرد على المجموعة' : 'الرد على الطلب'}
            </h2>

            {selectedRequest && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-bold text-lg mb-2">{selectedRequest.title}</h3>
                <p className="text-gray-700 mb-2">{selectedRequest.content}</p>
                <p className="text-sm text-gray-500">
                  من: {selectedRequest.userName} ({selectedRequest.userEmail})
                </p>
              </div>
            )}

            {selectedGroup && (
              <div className="mb-6">
                <div className="p-4 bg-purple-50 rounded-md mb-4">
                  <h3 className="font-bold text-lg mb-2">{selectedGroup.title}</h3>
                  {selectedGroup.description && (
                    <p className="text-gray-700 mb-2">{selectedGroup.description}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    عدد الطلبات: {selectedGroup.requestCount}
                  </p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  <h4 className="font-bold text-sm text-gray-700 mb-2">الطلبات في هذه المجموعة:</h4>
                  {groupRequests.map((req) => (
                    <div key={req.id} className="p-2 bg-white border rounded-md text-sm">
                      <p className="font-bold">{req.title}</p>
                      <p className="text-xs text-gray-600">{req.userName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                {selectedGroup 
                  ? 'اكتب ردك العام (سيتم إنشاء رد مخصص لكل طلب تلقائياً بواسطة الذكاء الاصطناعي)'
                  : 'اكتب ردك'
                }
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 h-40"
                placeholder="اكتب ردك هنا..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmitResponse}
                disabled={responding || !responseText.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {responding ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={responding}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
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

export default ViewRequestsEnhanced;
