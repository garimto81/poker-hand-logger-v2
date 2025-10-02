import { useStore } from '../store';
import { formatChips } from '@poker-logger/shared';

export default function TableList() {
  const { tables, isLoading, error } = useStore();

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

  if (tables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-500">
          등록된 테이블이 없습니다. 새 테이블을 생성해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-poker-green-light">
        <h2 className="text-xl font-bold text-white">테이블 목록 ({tables.length})</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {tables.map((table) => (
          <div
            key={table.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {table.name}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">게임 타입:</span> {table.gameType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">블라인드:</span> {formatChips(table.smallBlind)}/{formatChips(table.bigBlind)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">최대 인원:</span> {table.maxPlayers}명
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                  핸드 시작
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                  상세보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
