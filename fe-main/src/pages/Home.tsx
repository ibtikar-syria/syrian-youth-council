import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        مرحباً بكم في منصة مجلس الشباب السوري
      </h1>
      
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        منصة إلكترونية تسهل تواصل الشباب السوري في المغترب مع وزارة الشباب والرياضة السورية
      </p>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">📝 إرسال الطلبات</h3>
          <p className="text-gray-600">
            يمكنك إرسال طلباتك واستفساراتك إلى الوزارة بكل سهولة
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">🤖 تحليل ذكي</h3>
          <p className="text-gray-600">
            نستخدم الذكاء الاصطناعي لتصنيف وتجميع الطلبات المتشابهة
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">✉️ ردود مخصصة</h3>
          <p className="text-gray-600">
            احصل على ردود مخصصة من الوزارة على طلباتك
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="space-x-reverse space-x-4">
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700"
          >
            ابدأ الآن
          </Link>
          <Link
            to="/login"
            className="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-md text-lg hover:bg-gray-300"
          >
            تسجيل الدخول
          </Link>
        </div>
      )}

      {isAuthenticated && (
        <Link
          to="/create-request"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700"
        >
          أرسل طلبك الآن
        </Link>
      )}

      <div className="mt-16 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          عن المشروع
        </h2>
        <p className="text-gray-700 max-w-3xl mx-auto">
          هذا المشروع يتم تطويره بالتعاون بين تجمع إبتكار والاتحاد العام لطلبة سوريا - فرع تركيا،
          بهدف تسهيل التواصل بين الشباب السوري في المغترب ووزارة الشباب والرياضة السورية.
        </p>
      </div>
    </div>
  );
};

export default Home;
