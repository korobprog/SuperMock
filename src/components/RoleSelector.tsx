'use client';

import { useState, FC } from 'react';
// useEffect был удален, так как не используется после рефакторинга Google аутентификации

interface Session {
  id: string;
  interviewerId: string | null;
  intervieweeId: string | null;
  observerIds?: string[];
  status: string;
  date: string;
  videoLink?: string;
  videoLinkStatus?: string;
}

interface RoleSelectorProps {
  session: Session;
  onRoleSelect: (role: string) => void;
  disabled?: boolean;
}

const RoleSelector: FC<RoleSelectorProps> = ({
  session,
  onRoleSelect,
  disabled = false,
}) => {
  // Удалена проверка на Google пользователя, так как больше не требуется
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Удалена проверка на Google аутентификацию, так как больше не требуется

  // Проверяем доступность ролей
  const isInterviewerAvailable = !session.interviewerId;
  const isInterviewerTaken = !!session.interviewerId;
  const isIntervieweeAvailable = !session.intervieweeId;
  // Наблюдателей может быть сколько угодно

  const handleRoleChange = (role: string) => {
    // Удалена проверка на Google аутентификацию

    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedRole) {
      setError('Пожалуйста, выберите роль');
      return;
    }

    onRoleSelect(selectedRole);
  };

  return (
    <div className="w-full">
      {/* Удалено предупреждение о необходимости входа через Google */}

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Выберите роль:
          </p>

          <div className="space-y-2">
            <label
              className={`flex items-center p-3 rounded-md border ${
                !isInterviewerAvailable
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="interviewer"
                checked={selectedRole === 'interviewer'}
                onChange={() => handleRoleChange('interviewer')}
                disabled={!isInterviewerAvailable || disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Собеседующий</span>
                {!isInterviewerTaken && (
                  <span className="ml-2 text-sm text-green-500">
                    (доступно)
                  </span>
                )}
                {isInterviewerTaken && (
                  <span className="ml-2 text-sm text-red-500">(занято)</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Проводит собеседование и задает вопросы.
                  <span className="text-indigo-600 font-medium">
                    {' '}
                    Может добавлять ссылки на видеозвонки и управлять WebRTC
                    видеочатом.
                  </span>
                </p>
              </div>
            </label>

            <label
              className={`flex items-center p-3 rounded-md border ${
                !isIntervieweeAvailable
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="interviewee"
                checked={selectedRole === 'interviewee'}
                onChange={() => handleRoleChange('interviewee')}
                disabled={!isIntervieweeAvailable || disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Отвечающий</span>
                {!isIntervieweeAvailable && (
                  <span className="ml-2 text-sm text-red-500">(занято)</span>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Отвечает на вопросы и решает задачи
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 rounded-md border bg-white hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="observer"
                checked={selectedRole === 'observer'}
                onChange={() => handleRoleChange('observer')}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-medium">Наблюдатель</span>
                <p className="text-xs text-gray-500 mt-1">
                  Наблюдает за процессом собеседования
                </p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedRole || disabled}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !selectedRole || disabled
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Выбрать роль
        </button>
      </form>
    </div>
  );
};

export default RoleSelector;
