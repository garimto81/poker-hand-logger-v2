import { useState } from 'react';
import { useStore } from '../store';
import { playerApi } from '../api';

export default function CreatePlayerForm() {
  const { addPlayer, setError } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const player = await playerApi.create({
        name: formData.name,
        email: formData.email || undefined
      });
      addPlayer(player);

      // Reset form
      setFormData({ name: '', email: '' });

      alert('✅ 플레이어가 추가되었습니다!');
    } catch (error) {
      setError(error instanceof Error ? error.message : '플레이어 추가 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">새 플레이어 추가</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            플레이어 이름 *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            minLength={2}
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
            placeholder="예: 홍길동"
          />
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일 (선택)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-poker-green focus:border-transparent"
            placeholder="예: hong@example.com"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-poker-green text-white py-3 rounded-lg font-semibold hover:bg-poker-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '추가 중...' : '플레이어 추가'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>팁:</strong> 플레이어를 추가하면 테이블에서 핸드를 시작할 때 선택할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
