import { useEffect } from 'react';
import AppRouter from './Router';
import { useAuthStore } from './stores/authStore';
import './App.css';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <AppRouter />;
}

export default App;
