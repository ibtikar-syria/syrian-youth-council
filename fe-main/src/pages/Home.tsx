import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="text-center px-4 sm:px-0">
      {/* Hero Section */}
      <div className="mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-linear-to-r from-[#06332c] to-[#0a4a40] bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
          مرحباً بكم في منصة مجلس الشباب السوري
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
          منصة إلكترونية تسهل تواصل الشباب السوري في المغترب مع وزارة الشباب والرياضة السورية
        </p>

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 px-4">
            <Link
              to="/register"
              className="inline-block bg-linear-to-r from-[#06332c] to-[#0a4a40] text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:from-[#0a4a40] hover:to-[#06332c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ابدأ الآن
            </Link>
            <Link
              to="/login"
              className="inline-block bg-white text-[#06332c] px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-[#b9a779]/10 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-[#b9a779] transform hover:-translate-y-0.5"
            >
              تسجيل الدخول
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <Link
            to="/dashboard"
            className="inline-block bg-linear-to-r from-[#06332c] to-[#0a4a40] text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:from-[#0a4a40] hover:to-[#06332c] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            لوحة التحكّم
          </Link>
        )}
      </div>

      {/* Features Section */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/30">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📝</div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#06332c] mb-2 sm:mb-3">إرسال الطلبات</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            يمكنك إرسال طلباتك واستفساراتك إلى الوزارة بكل سهولة
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/30">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🤖</div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#06332c] mb-2 sm:mb-3">تحليل ذكي</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            نستخدم الذكاء الاصطناعي لتصنيف وتجميع الطلبات المتشابهة
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-[#b9a779]/30 sm:col-span-2 md:col-span-1">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✉️</div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#06332c] mb-2 sm:mb-3">ردود مخصصة</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            احصل على ردود مخصصة من الوزارة على طلباتك
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-16 sm:mt-20 bg-linear-to-br from-[#b9a779]/10 to-[#b9a779]/20 p-6 sm:p-8 md:p-10 rounded-2xl shadow-inner border border-[#b9a779]/40">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#06332c] mb-4 sm:mb-6">
          عن المشروع
        </h2>
        <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed px-2">
          هذا المشروع يتم تطويره بالتعاون بين تجمع إبتكار والاتحاد العام لطلبة سوريا - فرع تركيا،
          بهدف تسهيل التواصل بين الشباب السوري في المغترب ووزارة الشباب والرياضة السورية.
        </p>
      </div>
    </div>
  );
};

export default Home;
