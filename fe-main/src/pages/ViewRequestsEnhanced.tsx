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

interface Tag {
  id: string;
  name: string;
  nameAr: string;
}

type FilterStatus = 'all' | 'pending' | 'analyzing' | 'grouped' | 'responded';

const ViewRequestsEnhanced = () => {
  const [directRequests, setDirectRequests] = useState<Request[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupRequests, setGroupRequests] = useState<Request[]>([]);
  
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  useEffect(() => {
    fetchTags();
  }, []);

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

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setAvailableTags(response.data.tags);
    } catch (err) {
      console.error('Failed to fetch tags');
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
    setLoadingGroupDetails(true);
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
    } finally {
      setLoadingGroupDetails(false);
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
        return 'bg-[#b9a779]/20 text-[#8b7355]';
      case 'analyzing':
        return 'bg-[#06332c]/10 text-[#06332c]';
      case 'grouped':
        return 'bg-[#d4c5a0]/30 text-[#8b7355]';
      case 'responded':
        return 'bg-[#06332c]/20 text-[#06332c]';
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

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const filteredDirectRequests = directRequests.filter(req => {
    // Search query filter
    const matchesSearch = searchQuery === '' ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag filter
    const matchesTags = selectedTags.length === 0 ||
      (req.tags && req.tags.some(tag => {
        const matchingTag = availableTags.find(t => 
          t.name === tag.tagName || t.nameAr === tag.tagNameAr
        );
        return matchingTag && selectedTags.includes(matchingTag.id);
      }));
    
    return matchesSearch && matchesTags;
  });

  const filteredGroups = groups.filter(group => {
    // Search query filter
    const matchesSearch = searchQuery === '' ||
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag filter - match groups by their primary tag
    const matchesTags = selectedTags.length === 0 ||
      (group.tagNameAr && availableTags.some(tag => 
        tag.nameAr === group.tagNameAr && selectedTags.includes(tag.id)
      ));
    
    return matchesSearch && matchesTags;
  });

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">عرض الطلبات</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="analyzing">قيد التحليل</option>
            <option value="grouped">مجمّع</option>
            <option value="responded">تم الرد</option>
          </select>

          <button
            onClick={() => setShowTagFilter(!showTagFilter)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border rounded-md bg-[#06332c] text-white hover:bg-[#0a4a40] focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base whitespace-nowrap"
          >
            تصفية حسب الوسوم {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>
        </div>

        {/* Tag Filter Section */}
        {showTagFilter && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-row items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base">اختر الوسوم:</h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={handleClearTags}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800"
                >
                  مسح الكل
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد وسوم متاحة</p>
              ) : (
                availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-[#06332c] text-white'
                        : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {tag.nameAr || tag.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Direct Requests Section */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#06332c]">الطلبات المباشرة (من القادة الشباب)</h2>
        <div className="space-y-4">
          {filteredDirectRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg text-sm sm:text-base">لا توجد طلبات مباشرة</div>
          ) : (
            filteredDirectRequests.map((request) => (
              <div key={request.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-r-4 border-[#b9a779]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-[#b9a779]/20 text-[#06332c] px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        طلب مباشر
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold break-words">{request.title}</h3>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm break-words">
                      من: {request.userName} ({request.userEmail})
                    </p>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap text-sm sm:text-base break-words">{request.content}</p>

                {request.tags && request.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {request.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-200 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        {tag.tagNameAr || tag.tagName}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {new Date(request.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  {request.status !== 'responded' && (
                    <button
                      onClick={() => handleRespondToRequest(request)}
                      className="w-full sm:w-auto bg-[#06332c] text-white px-3 sm:px-4 py-2 rounded-md hover:bg-[#0a4a40] text-sm sm:text-base"
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
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#8b7355]">الطلبات العامة المجمعة (من الشباب)</h2>
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg text-sm sm:text-base">لا توجد مجموعات</div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-r-4 border-[#d4c5a0]">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-[#d4c5a0]/30 text-[#8b7355] px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                        مجموعة طلبات
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold break-words">{group.title}</h3>
                    </div>
                    {group.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 break-words">{group.description}</p>
                    )}
                    {group.tagNameAr && (
                      <span className="inline-block bg-[#b9a779]/10 text-[#8b7355] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                        {group.tagNameAr}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 text-center">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">{group.requestCount}</div>
                    <div className="text-xs sm:text-sm text-gray-600">إجمالي الطلبات</div>
                  </div>
                  <div className="bg-[#b9a779]/10 p-2 sm:p-3 rounded-md">
                    <div className="text-xl sm:text-2xl font-bold text-[#8b7355]">{group.pendingCount}</div>
                    <div className="text-xs sm:text-sm text-[#8b7355]">قيد الانتظار</div>
                  </div>
                  <div className="bg-[#06332c]/10 p-2 sm:p-3 rounded-md">
                    <div className="text-xl sm:text-2xl font-bold text-[#06332c]">{group.respondedCount}</div>
                    <div className="text-xs sm:text-sm text-[#06332c]">تم الرد</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {new Date(group.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleViewGroupRequests(group)}
                      disabled={loadingGroupDetails}
                      className="w-full sm:w-auto bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                    >
                      {loadingGroupDetails ? 'جاري التحميل...' : `عرض الطلبات (${group.requestCount})`}
                    </button>
                    {!group.hasResponse && (
                      <button
                        onClick={() => handleRespondToGroup(group)}
                        disabled={loadingGroupDetails}
                        className="w-full sm:w-auto bg-[#b9a779] text-white px-3 sm:px-4 py-2 rounded-md hover:bg-[#a0916a] disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
                      >
                        {loadingGroupDetails ? 'جاري التحميل...' : 'الرد على المجموعة'}
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 break-words">طلبات المجموعة: {selectedGroup.title}</h2>

            {selectedGroup.description && (
              <p className="text-gray-600 mb-4 text-sm sm:text-base break-words">{selectedGroup.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {groupRequests.map((req) => (
                <div key={req.id} className="p-3 sm:p-4 bg-gray-50 border rounded-md">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg break-words">{req.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">من: {req.userName} ({req.userEmail})</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(req.status)}`}>
                      {getStatusText(req.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-wrap break-words">{req.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(req.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {!selectedGroup.hasResponse && (
                <button
                  onClick={() => {
                    setShowRequestsModal(false);
                    setShowResponseModal(true);
                  }}
                  className="w-full sm:w-auto bg-[#b9a779] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#a0916a] text-sm sm:text-base"
                >
                  الرد على المجموعة
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="w-full sm:w-auto bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 rounded-md hover:bg-gray-400 text-sm sm:text-base"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              {selectedGroup ? 'الرد على المجموعة' : 'الرد على الطلب'}
            </h2>

            {selectedRequest && (
              <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-md">
                <h3 className="font-bold text-base sm:text-lg mb-2 break-words">{selectedRequest.title}</h3>
                <p className="text-gray-700 mb-2 text-sm sm:text-base break-words">{selectedRequest.content}</p>
                <p className="text-xs sm:text-sm text-gray-500 break-words">
                  من: {selectedRequest.userName} ({selectedRequest.userEmail})
                </p>
              </div>
            )}

            {selectedGroup && (
              <div className="mb-6">
                <div className="p-3 sm:p-4 bg-[#d4c5a0]/20 rounded-md mb-4">
                  <h3 className="font-bold text-base sm:text-lg mb-2 break-words">{selectedGroup.title}</h3>
                  {selectedGroup.description && (
                    <p className="text-gray-700 mb-2 text-sm sm:text-base break-words">{selectedGroup.description}</p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-600">
                    عدد الطلبات: {selectedGroup.requestCount}
                  </p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-700 mb-2">الطلبات في هذه المجموعة:</h4>
                  {groupRequests.map((req) => (
                    <div key={req.id} className="p-2 bg-white border rounded-md text-xs sm:text-sm">
                      <p className="font-bold break-words">{req.title}</p>
                      <p className="text-xs text-gray-600 break-words">{req.userName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2 text-sm sm:text-base">
                {selectedGroup 
                  ? 'اكتب ردك العام (سيتم إنشاء رد مخصص لكل طلب تلقائياً بواسطة الذكاء الاصطناعي)'
                  : 'اكتب ردك'
                }
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#b9a779] h-32 sm:h-40 text-sm sm:text-base"
                placeholder="اكتب ردك هنا..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={handleSubmitResponse}
                disabled={responding || !responseText.trim()}
                className="w-full sm:w-auto bg-[#06332c] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#0a4a40] disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {responding ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={responding}
                className="w-full sm:w-auto bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 rounded-md hover:bg-gray-400 disabled:bg-gray-200 text-sm sm:text-base"
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
