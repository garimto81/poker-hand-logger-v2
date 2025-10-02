import { useStore } from '../store';
import { formatChips } from '@poker-logger/shared';

export default function PlayerList() {
  const { players, isLoading, error } = useStore();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-500">
          등록된 플레이어가 없습니다. 새 플레이어를 추가해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-poker-green-light">
        <h2 className="text-xl font-bold text-white">플레이어 목록 ({players.length})</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {players.map((player) => (
          <div
            key={player.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {player.name}
                </h3>
                {player.email && (
                  <p className="text-sm text-gray-500 mt-1">{player.email}</p>
                )}
                <div className="mt-3 flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500">총 핸드</p>
                    <p className="text-lg font-bold text-poker-green">
                      {player.totalHands}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">총 수익</p>
                    <p className={`text-lg font-bold ${
                      player.totalWinnings >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatChips(player.totalWinnings)}
                    </p>
                  </div>
                </div>
              </div>

              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                통계 보기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
