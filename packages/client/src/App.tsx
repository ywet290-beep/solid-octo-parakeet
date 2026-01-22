import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Layout /> : <Login />;
};

export default App;