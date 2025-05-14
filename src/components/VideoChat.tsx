'use client';

import React, { useEffect, useRef, useState, useContext, FC } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import { useRouter, useParams } from 'next/navigation';
import Peer, { SignalData } from 'simple-peer';
import VideoLinkManager from './VideoLinkManager';

// Определяем типы для WebRTC
interface WebRTCSignal {
  type: string;
  sdp?: string; // SDP (Session Description Protocol) строка для WebRTC
  candidate?: RTCIceCandidate; // Кандидат ICE для WebRTC
  roomId: string;
  userId: string;
  targetUserId?: string;
}

// Тип для сигнальных данных simple-peer
type SimplePeerSignal = {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string; // SDP (Session Description Protocol) строка
  candidate?: RTCIceCandidate; // Кандидат ICE для установления соединения
};

interface Participant {
  userId: string;
  stream?: MediaStream;
  peer?: Peer.Instance;
}

interface VideoStreamProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  isVideoOff?: boolean;
}

// Компонент для отображения видеопотока
const VideoStream: FC<VideoStreamProps> = ({
  stream,
  label,
  muted = false,
  isVideoOff = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex-1 min-w-[240px] relative">
      <h3 className="text-lg font-medium mb-2">{label}</h3>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-[240px] bg-gray-800 rounded-lg object-cover ${
          isVideoOff ? 'opacity-50' : ''
        }`}
      />
      {!stream && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-2 rounded">
          Ожидание участника...
        </div>
      )}
      {isVideoOff && stream && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white p-2 rounded">
          Видео выключено
        </div>
      )}
    </div>
  );
};

interface VideoChatProps {
  sessionId?: string;
}

const VideoChat: FC<VideoChatProps> = ({ sessionId: propSessionId }) => {
  const socketContext = useContext(SocketContext);
  const router = useRouter();
  const params = useParams();

  // Получаем sessionId из props или из URL параметров
  const sessionId = propSessionId || (params?.sessionId as string);

  if (!socketContext) {
    return <div>Ошибка: SocketContext не найден</div>;
  }

  const { socket, connected } = socketContext;

  // Состояния
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomId] = useState<string>(sessionId || '');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Отключено');
  const [userId, setUserId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isInterviewer, setIsInterviewer] = useState<boolean>(false);
  const [externalVideoLink, setExternalVideoLink] = useState<string>('');

  // Ссылки на потоки экрана
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Инициализация медиа-потока
  // Получение токена из localStorage при монтировании
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }

    // Проверяем роль пользователя
    const userRole = localStorage.getItem('userRole');
    setIsInterviewer(userRole === 'interviewer');
  }, []);

  useEffect(() => {
    console.log('VideoChat: Проверка условий для подключения:', {
      connected,
      socketExists: !!socket,
      roomId,
      token,
    });

    if (!connected || !socket || !roomId) {
      console.log('VideoChat: Не выполнены условия для подключения');
      return;
    }

    const initializeMedia = async () => {
      console.log('VideoChat: Начало инициализации медиа-потоков');
      console.log('VideoChat: Состояние сокета:', {
        socketExists: !!socket,
        socketId: socket?.id,
        socketConnected: socket?.connected,
      });

      try {
        console.log('VideoChat: Запрос доступа к камере и микрофону');
        console.log('VideoChat: Доступные медиа-устройства:');

        // Логируем доступные устройства
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === 'videoinput'
          );
          const audioDevices = devices.filter(
            (device) => device.kind === 'audioinput'
          );

          console.log('VideoChat: Видео устройства:', videoDevices.length);
          console.log('VideoChat: Аудио устройства:', audioDevices.length);

          // Детальная информация о каждом устройстве
          videoDevices.forEach((device, index) => {
            console.log(`VideoChat: Видео устройство ${index + 1}:`, {
              deviceId: device.deviceId,
              groupId: device.groupId,
              label: device.label,
            });
          });

          audioDevices.forEach((device, index) => {
            console.log(`VideoChat: Аудио устройство ${index + 1}:`, {
              deviceId: device.deviceId,
              groupId: device.groupId,
              label: device.label,
            });
          });

          // Проверяем разрешения
          console.log('VideoChat: Проверка разрешений для медиа-устройств');
          const permissions = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          console.log(
            'VideoChat: Статус разрешения для камеры:',
            permissions.state
          );
        } catch (enumError: any) {
          console.error(
            'VideoChat: Ошибка при перечислении устройств:',
            enumError
          );
          console.error('VideoChat: Тип ошибки:', enumError.name);
          console.error('VideoChat: Сообщение ошибки:', enumError.message);
        }

        console.log(
          'VideoChat: Попытка получения медиа-потока с параметрами:',
          {
            video: true,
            audio: true,
          }
        );

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        console.log('VideoChat: Доступ к медиа-устройствам получен');
        console.log('VideoChat: Информация о потоке:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoTrackLabel: stream.getVideoTracks()[0]?.label,
          audioTrackLabel: stream.getAudioTracks()[0]?.label,
        });

        console.log(
          'VideoChat: Перед сохранением локального потока в состоянии:',
          {
            streamExists: !!stream,
            videoTracks: stream.getVideoTracks().length,
            audioTracks: stream.getAudioTracks().length,
            videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
            audioTrackEnabled: stream.getAudioTracks()[0]?.enabled,
          }
        );

        setLocalStream(stream);

        // Проверка состояния после setLocalStream (будет асинхронным)
        setTimeout(() => {
          console.log(
            'VideoChat: Проверка состояния localStream после setState:',
            {
              streamInStateExists: !!localStream,
              videoTracksInState: localStream?.getVideoTracks()?.length || 0,
              audioTracksInState: localStream?.getAudioTracks()?.length || 0,
            }
          );
        }, 100);

        // Получаем userId из сокета
        const userIdFromSocket = socket.id;
        console.log('VideoChat: ID сокета получен:', userIdFromSocket);

        if (userIdFromSocket) {
          setUserId(userIdFromSocket);
        }

        // Присоединяемся к комнате WebRTC
        console.log(
          'VideoChat: Отправка запроса на присоединение к комнате:',
          roomId
        );
        socket.emit('join-room', roomId);
        console.log('VideoChat: Запрос на присоединение отправлен');
        setConnectionStatus('Подключение...');
      } catch (error: any) {
        console.error('VideoChat: Ошибка при получении медиа-потока:', error);
        console.error(
          'VideoChat: Полная информация об ошибке:',
          JSON.stringify(error, null, 2)
        );
        console.error('VideoChat: Название ошибки:', error.name);
        console.error('VideoChat: Сообщение ошибки:', error.message);
        console.error('VideoChat: Стек ошибки:', error.stack);

        // Проверяем, поддерживается ли getUserMedia в браузере
        console.log(
          'VideoChat: Проверка поддержки getUserMedia в браузере:',
          'mediaDevices' in navigator &&
            'getUserMedia' in navigator.mediaDevices
        );

        // Проверяем, есть ли ограничения в контексте безопасности
        console.log(
          'VideoChat: Проверка контекста безопасности:',
          window.isSecureContext
            ? 'Безопасный контекст'
            : 'Небезопасный контекст'
        );

        // Проверяем протокол
        console.log('VideoChat: Текущий протокол:', window.location.protocol);

        // Более детальная обработка ошибок доступа к медиа
        if (error.name === 'NotAllowedError') {
          console.log(
            'VideoChat: Пользователь запретил доступ к медиа-устройствам'
          );
          setConnectionStatus(
            'Доступ к камере/микрофону запрещен пользователем'
          );
        } else if (error.name === 'NotFoundError') {
          console.log('VideoChat: Медиа-устройства не найдены');
          setConnectionStatus('Камера или микрофон не найдены');
        } else if (error.name === 'NotReadableError') {
          console.log('VideoChat: Медиа-устройства заняты другим приложением');
          setConnectionStatus(
            'Устройство камеры/микрофона занято другим приложением'
          );
        } else if (error.name === 'AbortError') {
          console.log(
            'VideoChat: Запрос на доступ к медиа-устройствам был отменен'
          );
          setConnectionStatus(
            'Запрос на доступ к медиа-устройствам был отменен'
          );
        } else if (error.name === 'SecurityError') {
          console.log(
            'VideoChat: Ошибка безопасности при доступе к медиа-устройствам'
          );
          setConnectionStatus(
            'Ошибка безопасности при доступе к медиа-устройствам'
          );
        } else {
          console.log(
            'VideoChat: Неизвестная ошибка при доступе к медиа-устройствам'
          );
          setConnectionStatus('Ошибка доступа к камере/микрофону');
        }
      }
    };

    initializeMedia();

    // Настройка обработчиков событий Socket.IO
    console.log('VideoChat: Настройка обработчиков событий Socket.IO');

    socket.on(
      'room-joined',
      (data: { roomId: string; participants: string[]; userId: string }) => {
        console.log('VideoChat: Присоединился к комнате:', data);
        setUserId(data.userId);
        setConnectionStatus(
          `Подключен к комнате (${data.participants.length} участников)`
        );

        // Инициализируем список участников, исключая себя
        const otherParticipants = data.participants.filter(
          (id) => id !== data.userId
        );
        console.log(
          'VideoChat: Другие участники в комнате:',
          otherParticipants
        );

        setParticipants(otherParticipants.map((id) => ({ userId: id })));

        // Создаем соединения с существующими участниками
        otherParticipants.forEach((participantId) => {
          console.log(
            'VideoChat: Создание соединения с участником:',
            participantId
          );
          createPeer(participantId, true, data.userId);
        });
      }
    );

    socket.on('user-joined', (data: { roomId: string; userId: string }) => {
      console.log('Новый пользователь присоединился:', data);

      // Добавляем нового участника в список
      setParticipants((prev) => [...prev, { userId: data.userId }]);

      // Создаем соединение с новым участником
      createPeer(data.userId, false, userId);
    });

    socket.on('user-left', (data: { roomId: string; userId: string }) => {
      console.log('Пользователь покинул комнату:', data);

      // Удаляем участника из списка и закрываем соединение
      setParticipants((prev) => {
        const participant = prev.find((p) => p.userId === data.userId);
        if (participant && participant.peer) {
          participant.peer.destroy();
        }
        return prev.filter((p) => p.userId !== data.userId);
      });

      setConnectionStatus(
        `Подключен к комнате (${participants.length} участников)`
      );
    });

    socket.on('webrtc-signal', (signal: WebRTCSignal) => {
      console.log('VideoChat: Получен WebRTC сигнал:', signal);
      console.log('VideoChat: Тип сигнала:', signal.type);
      console.log('VideoChat: От пользователя:', signal.userId);
      console.log('VideoChat: Для комнаты:', signal.roomId);
      console.log('VideoChat: Текущий userId:', userId);

      if (signal.userId === userId) {
        console.log('VideoChat: Игнорирование собственного сигнала');
        return; // Игнорируем собственные сигналы
      }

      const participant = participants.find((p) => p.userId === signal.userId);
      console.log(
        'VideoChat: Найден участник для сигнала:',
        participant?.userId
      );
      console.log(
        'VideoChat: Peer соединение существует:',
        !!participant?.peer
      );

      if (signal.type === 'offer') {
        console.log('VideoChat: Получено предложение от нового участника');
        // Получили предложение от нового участника
        console.log(
          'VideoChat: Создание peer соединения для ответа на предложение'
        );
        createPeer(signal.userId, false, userId, signal);
      } else if (participant && participant.peer) {
        console.log('VideoChat: Передача сигнала в существующее соединение');
        // Передаем сигнал в существующее соединение
        // Используем только необходимые поля из сигнала
        if (signal.sdp) {
          console.log('VideoChat: Передача SDP сигнала');
          console.log(
            'VideoChat: SDP содержимое:',
            signal.sdp.substring(0, 50) + '...'
          );
          try {
            participant.peer.signal({
              type: signal.type as any,
              sdp: signal.sdp,
            });
            console.log('VideoChat: SDP сигнал успешно передан в peer');
          } catch (error) {
            console.error('VideoChat: Ошибка при передаче SDP сигнала:', error);
          }
        } else if (signal.candidate) {
          console.log('VideoChat: Передача ICE candidate');
          console.log('VideoChat: ICE candidate:', signal.candidate);
          try {
            participant.peer.signal({
              type: 'candidate',
              candidate: signal.candidate,
            } as { type: 'candidate'; candidate: RTCIceCandidate });
            console.log('VideoChat: ICE candidate успешно передан в peer');
          } catch (error) {
            console.error(
              'VideoChat: Ошибка при передаче ICE candidate:',
              error
            );
          }
        }
      } else {
        console.log(
          'VideoChat: Не удалось обработать сигнал - участник не найден или нет peer соединения'
        );
        console.log(
          'VideoChat: Текущие участники:',
          participants.map((p) => p.userId)
        );
      }
    });

    return () => {
      // Очистка при размонтировании
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }

      // Закрываем все peer-соединения
      participants.forEach((participant) => {
        if (participant.peer) {
          participant.peer.destroy();
        }
      });

      // Отписываемся от событий и покидаем комнату
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('webrtc-signal');
      socket.emit('leave-room', roomId);
    };
  }, [connected, socket, roomId]);

  // Создание peer-соединения
  const createPeer = (
    targetUserId: string,
    isInitiator: boolean,
    myUserId: string,
    incomingSignal?: WebRTCSignal
  ): Peer.Instance | undefined => {
    console.log('VideoChat: Состояние перед созданием peer:', {
      socketExists: !!socket,
      socketConnected: socket?.connected,
      localStreamExists: !!localStream,
      videoTracks: localStream?.getVideoTracks()?.length || 0,
      audioTracks: localStream?.getAudioTracks()?.length || 0,
      videoTrackEnabled: localStream?.getVideoTracks()[0]?.enabled,
      audioTrackEnabled: localStream?.getAudioTracks()[0]?.enabled,
      targetUserId,
      isInitiator,
      myUserId,
    });

    if (!socket || !localStream) {
      const errorMessage =
        'VideoChat: Невозможно создать peer - отсутствует сокет или локальный поток';
      console.error(errorMessage);

      console.log('VideoChat: Состояние сокета:', {
        socketExists: !!socket,
        socketConnected: socket?.connected,
      });

      console.log('VideoChat: Состояние локального потока:', {
        streamExists: !!localStream,
        videoTracks: localStream?.getVideoTracks()?.length || 0,
        audioTracks: localStream?.getAudioTracks()?.length || 0,
      });

      // Проверка состояния React
      console.log('VideoChat: Проверка состояния React компонента:', {
        isMounted: true, // Если функция выполняется, компонент смонтирован
        roomId,
        userId,
        participantsCount: participants.length,
      });

      // Обновляем статус соединения для пользователя
      if (!socket) {
        setConnectionStatus('Ошибка: отсутствует соединение с сервером');
      } else if (!localStream) {
        setConnectionStatus('Ошибка: отсутствует доступ к камере/микрофону');
      }

      // Пытаемся восстановить соединение через некоторое время
      setTimeout(() => {
        if (socket && socket.connected && !localStream) {
          console.log(
            'VideoChat: Повторная попытка получить доступ к медиа-устройствам'
          );

          // Проверяем состояние разрешений перед повторной попыткой
          navigator.permissions
            .query({ name: 'camera' as PermissionName })
            .then((permissionStatus) => {
              console.log(
                'VideoChat: Текущий статус разрешения для камеры:',
                permissionStatus.state
              );

              // Пробуем получить доступ только к аудио, если есть проблемы с видео
              console.log(
                'VideoChat: Пробуем получить доступ с разными параметрами'
              );

              // Сначала пробуем с видео и аудио
              navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                  setLocalStream(stream);
                  console.log(
                    'VideoChat: Доступ к видео и аудио получен при повторной попытке'
                  );
                  // Повторно создаем соединение
                  if (targetUserId) {
                    createPeer(
                      targetUserId,
                      isInitiator,
                      myUserId,
                      incomingSignal
                    );
                  }
                })
                .catch((videoAudioError) => {
                  console.error(
                    'VideoChat: Повторная попытка получить доступ к видео и аудио не удалась:',
                    videoAudioError
                  );

                  // Пробуем только аудио
                  console.log(
                    'VideoChat: Пробуем получить доступ только к аудио'
                  );
                  navigator.mediaDevices
                    .getUserMedia({ video: false, audio: true })
                    .then((audioStream) => {
                      setLocalStream(audioStream);
                      console.log(
                        'VideoChat: Доступ только к аудио получен при повторной попытке'
                      );
                      setConnectionStatus(
                        'Подключено только аудио (видео недоступно)'
                      );
                      // Повторно создаем соединение
                      if (targetUserId) {
                        createPeer(
                          targetUserId,
                          isInitiator,
                          myUserId,
                          incomingSignal
                        );
                      }
                    })
                    .catch((audioError) => {
                      console.error(
                        'VideoChat: Повторная попытка получить доступ только к аудио не удалась:',
                        audioError
                      );
                      setConnectionStatus(
                        'Ошибка: не удалось получить доступ к камере/микрофону'
                      );
                    });
                });
            })
            .catch((permError) => {
              console.error(
                'VideoChat: Ошибка при проверке разрешений:',
                permError
              );
            });
        }
      }, 5000);

      return undefined;
    }

    console.log(
      `VideoChat: Создание peer-соединения с ${targetUserId}, инициатор: ${isInitiator}`
    );
    console.log('VideoChat: Мой userId:', myUserId);
    console.log(
      'VideoChat: Входящий сигнал:',
      incomingSignal ? 'присутствует' : 'отсутствует'
    );

    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];

    console.log('VideoChat: Используемые ICE серверы:', iceServers);

    let peer: Peer.Instance;

    try {
      peer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: localStream,
        config: {
          iceServers,
        },
        // Добавляем таймауты для улучшения обработки ошибок
        sdpTransform: (sdp: string) => {
          console.log('VideoChat: SDP Transform вызван');
          return sdp;
        },
      });

      console.log('VideoChat: Peer соединение создано успешно');
    } catch (error: any) {
      console.error('VideoChat: Ошибка при создании Peer соединения:', error);
      console.error('VideoChat: Сообщение ошибки:', error.message);

      // Обновляем статус соединения
      setConnectionStatus(`Ошибка создания соединения: ${error.message}`);

      // Логируем детали ошибки
      if (error.name) console.error('VideoChat: Тип ошибки:', error.name);
      if (error.stack) console.error('VideoChat: Стек ошибки:', error.stack);

      return undefined;
    }

    // Проверяем, что peer был успешно создан
    if (!peer) {
      console.error('VideoChat: Peer соединение не было создано');
      return undefined;
    }

    // Обработка сигналов
    peer.on('signal', (data: SignalData) => {
      console.log('VideoChat: Генерация сигнала для отправки:', data);
      console.log('VideoChat: Тип сигнала:', data.type || 'candidate');

      // Создаем объект WebRTCSignal из данных simple-peer
      const signal: WebRTCSignal = {
        type: data.type || 'candidate',
        roomId,
        userId: myUserId,
        targetUserId,
      };

      // Добавляем sdp, если это offer или answer
      if (data.type === 'offer' || data.type === 'answer') {
        signal.sdp = (data as RTCSessionDescriptionInit).sdp as string;
        console.log(
          'VideoChat: SDP сигнал:',
          signal.sdp?.substring(0, 50) + '...'
        );
      }

      // Добавляем candidate, если это ice candidate
      if ('candidate' in data) {
        signal.candidate = data.candidate;
        console.log('VideoChat: ICE candidate:', signal.candidate);
      }

      console.log('VideoChat: Отправка WebRTC сигнала через сокет');
      socket.emit('webrtc-signal', signal);
      console.log('VideoChat: Сигнал отправлен');
    });

    // Обработка получения потока
    peer.on('stream', (stream: MediaStream) => {
      console.log(`VideoChat: Получен поток от ${targetUserId}`);
      console.log('VideoChat: Информация о полученном потоке:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackLabel: stream.getVideoTracks()[0]?.label,
        audioTrackLabel: stream.getAudioTracks()[0]?.label,
      });

      setParticipants((prev) => {
        return prev.map((p) => {
          if (p.userId === targetUserId) {
            console.log(
              `VideoChat: Обновление участника ${targetUserId} с новым потоком`
            );
            return { ...p, stream, peer };
          }
          return p;
        });
      });
    });

    // Обработка закрытия соединения
    peer.on('close', () => {
      console.log(`VideoChat: Соединение с ${targetUserId} закрыто`);
      setParticipants((prev) => prev.filter((p) => p.userId !== targetUserId));
    });

    // Обработка ошибок
    peer.on('error', (err: Error) => {
      console.error(`VideoChat: Ошибка соединения с ${targetUserId}:`, err);
      console.error('VideoChat: Сообщение ошибки:', err.message);
      console.error('VideoChat: Тип ошибки:', err.name);
      console.error('VideoChat: Стек ошибки:', err.stack);

      // Обработка конкретных типов ошибок WebRTC
      if (err.message.includes('ICE connection failed')) {
        console.error(
          'VideoChat: Ошибка ICE соединения - проблемы с сетью или брандмауэром'
        );
        setConnectionStatus('Ошибка соединения: проблемы с сетью');
      } else if (err.message.includes('User denied media access')) {
        console.error(
          'VideoChat: Пользователь запретил доступ к медиа-устройствам'
        );
        setConnectionStatus('Ошибка: доступ к камере/микрофону запрещен');
      } else if (err.message.includes('Could not start video source')) {
        console.error('VideoChat: Не удалось запустить видеоисточник');
        setConnectionStatus('Ошибка: не удалось запустить камеру');
      } else {
        setConnectionStatus(`Ошибка соединения: ${err.message}`);
      }

      // Попытка восстановить соединение при определенных ошибках
      if (
        err.message.includes('ICE connection failed') ||
        err.message.includes('ICE connection disconnected')
      ) {
        console.log('VideoChat: Попытка восстановить соединение...');
        // Удаляем проблемного участника и пытаемся переподключиться
        setParticipants((prev) =>
          prev.filter((p) => p.userId !== targetUserId)
        );
        setTimeout(() => {
          if (socket && socket.connected) {
            console.log(
              'VideoChat: Повторное создание соединения с',
              targetUserId
            );
            createPeer(targetUserId, true, userId);
          }
        }, 3000);
      }
    });

    // Обработка состояния ICE соединения
    peer.on('connect', () => {
      console.log(`VideoChat: Peer соединение с ${targetUserId} установлено`);
    });

    // Если у нас есть входящий сигнал, передаем его в peer
    if (incomingSignal) {
      // Используем только необходимые поля из сигнала
      if (incomingSignal.sdp) {
        peer.signal({
          type: incomingSignal.type as any,
          sdp: incomingSignal.sdp,
        });
      } else if (incomingSignal.candidate) {
        peer.signal({
          type: 'candidate',
          candidate: incomingSignal.candidate,
        } as { type: 'candidate'; candidate: RTCIceCandidate });
      }
    }

    // Обновляем список участников
    setParticipants((prev) => {
      const existingIndex = prev.findIndex((p) => p.userId === targetUserId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], peer };
        return updated;
      }
      return [...prev, { userId: targetUserId, peer }];
    });

    return peer;
  };

  // Переключение микрофона
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Переключение видео
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Включение/выключение демонстрации экрана
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Останавливаем демонстрацию экрана
        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
        }
        setScreenStream(null);
        setIsScreenSharing(false);

        // Обновляем все peer-соединения, чтобы использовать только камеру
        participants.forEach((participant) => {
          if (participant.peer) {
            // Удаляем старые треки
            if (screenStream) {
              screenStream.getTracks().forEach((track) => {
                participant.peer?.removeTrack(track, screenStream);
              });
            }

            // Добавляем треки камеры обратно
            if (localStream) {
              localStream.getTracks().forEach((track) => {
                participant.peer?.addTrack(track, localStream);
              });
            }
          }
        });
      } else {
        // Запускаем демонстрацию экрана
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setScreenStream(stream);
        setIsScreenSharing(true);
        screenStreamRef.current = stream;

        // Обновляем все peer-соединения, чтобы использовать экран
        participants.forEach((participant) => {
          if (participant.peer) {
            // Удаляем треки камеры
            if (localStream) {
              localStream.getVideoTracks().forEach((track) => {
                participant.peer?.removeTrack(track, localStream);
              });
            }

            // Добавляем треки экрана
            stream.getTracks().forEach((track) => {
              participant.peer?.addTrack(track, stream);
            });
          }
        });

        // Обработка остановки демонстрации экрана пользователем
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Ошибка при демонстрации экрана:', error);
    }
  };

  // Завершение звонка
  const endCall = () => {
    if (socket) {
      socket.emit('leave-room', roomId);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    // Закрываем все peer-соединения
    participants.forEach((participant) => {
      if (participant.peer) {
        participant.peer.destroy();
      }
    });

    setParticipants([]);
    setLocalStream(null);
    setScreenStream(null);
    setConnectionStatus('Отключено');

    // Возвращаемся на предыдущую страницу
    router.back();
  };

  // Обработчик обновления внешней ссылки на видео
  const handleVideoLinkUpdated = (videoLink: string) => {
    setExternalVideoLink(videoLink);
    console.log('Внешняя ссылка на видео обновлена:', videoLink);
  };

  // Открытие внешней ссылки на видео в новом окне
  const openExternalVideoLink = () => {
    if (externalVideoLink) {
      window.open(externalVideoLink, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <h2 className="text-2xl font-bold mb-4">Видеочат</h2>

      {/* Компонент для управления внешними ссылками на видео */}
      {token && (
        <VideoLinkManager
          token={token}
          isInterviewer={isInterviewer}
          sessionId={roomId}
          onVideoLinkUpdated={handleVideoLinkUpdated}
        />
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <p className="mb-2">Статус WebRTC: {connectionStatus}</p>
        <p className="mb-4">Участники: {participants.length + 1}</p>

        <div className="flex flex-wrap gap-4 mb-5">
          {/* Локальный видеопоток */}
          <VideoStream
            stream={isScreenSharing ? screenStream : localStream}
            label="Вы"
            muted={true}
            isVideoOff={isVideoOff && !isScreenSharing}
          />

          {/* Видеопотоки участников */}
          {participants.map((participant) => (
            <VideoStream
              key={participant.userId}
              stream={participant.stream || null}
              label={`Участник ${participant.userId.substring(0, 5)}...`}
            />
          ))}

          {/* Заполнители для отсутствующих участников (до 4 всего) */}
          {Array.from({ length: Math.max(0, 3 - participants.length) }).map(
            (_, index) => (
              <VideoStream
                key={`empty-${index}`}
                stream={null}
                label={`Ожидание участника ${index + participants.length + 1}`}
              />
            )
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={toggleMute}
            className={`px-4 py-2 rounded font-medium ${
              isMuted ? 'bg-red-600' : 'bg-blue-600'
            } text-white`}
          >
            {isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
          </button>
          <button
            onClick={toggleVideo}
            className={`px-4 py-2 rounded font-medium ${
              isVideoOff ? 'bg-red-600' : 'bg-blue-600'
            } text-white`}
          >
            {isVideoOff ? 'Включить видео' : 'Выключить видео'}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`px-4 py-2 rounded font-medium ${
              isScreenSharing ? 'bg-green-600' : 'bg-blue-600'
            } text-white`}
          >
            {isScreenSharing
              ? 'Остановить демонстрацию'
              : 'Демонстрация экрана'}
          </button>
          <button
            onClick={endCall}
            className="px-4 py-2 rounded font-medium bg-red-600 text-white"
          >
            Завершить звонок
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
