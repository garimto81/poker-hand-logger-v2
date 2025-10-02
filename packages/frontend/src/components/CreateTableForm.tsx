import { useState } from 'react';
import { useStore } from '../store';
import { tableApi } from '../api';
import { GameType } from '@poker-logger/shared';

export default function CreateTableForm() {
  const { addTable, setError } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    gameType: GameType.CASH,
    smallBlind: 1,
    bigBlind: 2,
    maxPlayers: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const table = await tableApi.create(formData);
      addTable(table);

      // Reset form
      setFormData({
        name: '',
        gameType: GameType.CASH,
        smallBlind: 1,
        bigBlind: 2,
        maxPlayers: 10
      });

      alert('✅ 테이블이 생성되었습니다!');
    } catch (error) {
      setError(error instanceof Error ? error.message : '테이블 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">새 테이블 생성</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Table Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            테이블 이름 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={3}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
            placeholder="예: Main Table"
          />
        </div>

        {/* Game Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            게임 타입 *
          </label>
          <select
            value={formData.gameType}
            onChange={(e) => setFormData({ ...formData, gameType: e.target.value as GameType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
          >
            <option value={GameType.CASH}>Cash Game</option>
            <option value={GameType.TOURNAMENT}>Tournament</option>
            <option value={GameType.SIT_AND_GO}>Sit & Go</option>
          </select>
        </div>

        {/* Small Blind */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            스몰 블라인드 *
          </label>
          <input
            type="number"
            value={formData.smallBlind}
            onChange={(e) => setFormData({ ...formData, smallBlind: Number(e.target.value) })}
            required
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
          />
        </div>

        {/* Big Blind */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            빅 블라인드 *
          </label>
          <input
            type="number"
            value={formData.bigBlind}
            onChange={(e) => setFormData({ ...formData, bigBlind: Number(e.target.value) })}
            required
            min={formData.smallBlind}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
          />
        </div>

        {/* Max Players */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            최대 인원 *
          </label>
          <input
            type="number"
            value={formData.maxPlayers}
            onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
            required
            min={2}
            max={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-poker-green text-white py-3 rounded-lg font-semibold hover:bg-poker-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '생성 중...' : '테이블 생성'}
        </button>
      </form>
    </div>
  );
}
