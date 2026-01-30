import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.config';

// Components
import Login from './components/Auth/Login';
import Navigation from './components/Layout/Navigation';
import WardrobeView from './components/Wardrobe/WardrobeView';
import OutfitGenerator from './components/Outfits/OutfitGenerator';
import OutfitHistory from './components/Outfits/OutfitHistory';
import ShoppingRecommendations from './components/Shopping/ShoppingRecommendations';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/wardrobe" replace />} />
          <Route path="/wardrobe" element={<WardrobeView user={user} />} />
          <Route path="/generate" element={<OutfitGenerator user={user} />} />
          <Route path="/history" element={<OutfitHistory user={user} />} />
          <Route path="/shop" element={<ShoppingRecommendations user={user} />} />
        </Routes>
      </div>
      <Navigation />
    </Router>
  );
}

export default App;
