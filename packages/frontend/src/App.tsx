import { useState, useEffect } from 'react';
import { useStore } from './store';
import { tableApi, playerApi } from './api';
import TableList from './components/TableList';
import PlayerList from './components/PlayerList';
import CreateTableForm from './components/CreateTableForm';
import CreatePlayerForm from './components/CreatePlayerForm';

function App() {
  const [activeTab, setActiveTab] = useState<'tables' | 'players'>('tables');
  const { setTables, setPlayers, setLoading, setError } = useStore();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tables, players] = await Promise.all([
          tableApi.getAll(),
          playerApi.getAll()
        ]);
        setTables(tables);
        setPlayers(players);
      } catch (error) {
        setError(error instanceof Error ? error.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setTables, setPlayers, setLoading, setError]);

  return (
    <div className="min-h-screen bg-poker-green">
      <header className="bg-poker-green-dark text-white py-6 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">🃏 포커 핸드 로거 v2.0</h1>
          <p className="text-poker-gold mt-2">실시간 포커 핸드 기록 및 분석 시스템</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'tables'
                ? 'bg-white text-poker-green shadow-lg'
                : 'bg-poker-green-light text-white hover:bg-poker-green-dark'
            }`}
          >
            테이블 관리
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'players'
                ? 'bg-white text-poker-green shadow-lg'
                : 'bg-poker-green-light text-white hover:bg-poker-green-dark'
            }`}
          >
            플레이어 관리
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Forms Column */}
          <div className="lg:col-span-1">
            {activeTab === 'tables' ? (
              <CreateTableForm />
            ) : (
              <CreatePlayerForm />
            )}
          </div>

          {/* List Column */}
          <div className="lg:col-span-2">
            {activeTab === 'tables' ? (
              <TableList />
            ) : (
              <PlayerList />
            )}
          </div>
        </div>
      </main>

      <footer className="bg-poker-green-dark text-white py-4 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            © 2024 Poker Hand Logger v2.0 | React + Fastify + PostgreSQL
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
