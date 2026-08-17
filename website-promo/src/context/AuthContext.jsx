import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar estado a partir do localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('game_token');
    const savedUser = localStorage.getItem('game_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
        fetchUserData(savedToken);
      } catch (e) {
        console.error('Erro ao ler dados do usuário:', e);
      }
    }
    setLoading(false);
  }, []);

  const fetchUserData = async (authToken) => {
    try {
      const t = authToken || token;
      if (!t) return;

      const res = await fetch('/api/user/balance', {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({
          ...prev,
          coins: data.coins,
          total_wins: data.total_wins,
          total_losses: data.total_losses,
          total_earnings: data.total_earnings
        }));

        // Buscar estatísticas detalhadas
        if (user?.id) {
          const statsRes = await fetch(`/api/stats/${user.id}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        }
      }
    } catch (err) {
      console.warn('Falha ao atualizar dados do usuário:', err);
    }
  };

  const login = async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no login');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('game_token', data.token);
    localStorage.setItem('game_user', JSON.stringify(data.user));
    fetchUserData(data.token);
    return data;
  };

  const register = async (username, email, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no registro');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('game_token', data.token);
    localStorage.setItem('game_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStats(null);
    localStorage.removeItem('game_token');
    localStorage.removeItem('game_user');
  };

  const watchAd = async () => {
    if (!token) throw new Error('Faça login primeiro');
    const res = await fetch('/api/watch-ad', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao creditar recompensa');

    setUser(prev => ({ ...prev, coins: data.coins }));
    return data;
  };

  const buyPackage = async (packageId) => {
    if (!token) throw new Error('Faça login primeiro');
    const res = await fetch('/api/marketplace/buy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na compra');

    setUser(prev => ({ ...prev, coins: data.coins }));
    return data;
  };

  // Calcular patente militar baseado em vitórias/pontos
  const getMilitaryRank = () => {
    const wins = user?.total_wins || 0;
    if (wins >= 50) return { title: 'Almirante de Esquadra', stars: 5, color: '#ffd700' };
    if (wins >= 25) return { title: 'Capitão de Mar e Guerra', stars: 4, color: '#00f2ff' };
    if (wins >= 10) return { title: 'Capitão-Tenente', stars: 3, color: '#00ff88' };
    if (wins >= 3)  return { title: 'Sargento Naval', stars: 2, color: '#94a3b8' };
    return { title: 'Recruta do Estreito', stars: 1, color: '#64748b' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        loading,
        login,
        register,
        logout,
        watchAd,
        buyPackage,
        fetchUserData,
        getMilitaryRank
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
