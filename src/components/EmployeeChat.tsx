import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api, type EmployeeChat as EmployeeChatType, type ChatMessage } from '@/lib/api';

interface Colleague {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  avatar_url?: string;
}

interface EmployeeChatProps {
  currentUserId: number;
  companyId: number;
}

export default function EmployeeChat({ currentUserId, companyId }: EmployeeChatProps) {
  const [chats, setChats] = useState<EmployeeChatType[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<{ id: number; name: string; position?: string; avatar?: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadChats();
    loadColleagues();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedChatId) {
      pollRef.current = setInterval(() => {
        loadMessages(selectedChatId);
        loadChats();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedChatId]);

  const loadChats = async () => {
    try {
      const data = await api.getEmployeeChats(currentUserId, companyId);
      setChats(data);
    } catch (e) {
      console.error('Failed to load chats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadColleagues = async () => {
    try {
      const data = await api.getCompanyEmployees(companyId, currentUserId);
      setColleagues(data);
    } catch (e) {
      console.error('Failed to load colleagues:', e);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const data = await api.getEmployeeMessages(chatId);
      setMessages(data);
      await api.markEmployeeMessagesRead(chatId, currentUserId);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const selectChat = async (chat: EmployeeChatType) => {
    setSelectedChatId(chat.id);
    setSelectedPeer({
      id: chat.peer_id,
      name: chat.peer_name,
      position: chat.peer_position,
      avatar: chat.peer_avatar
    });
    setShowNewChat(false);
    await loadMessages(chat.id);
    await api.markEmployeeMessagesRead(chat.id, currentUserId);
    loadChats();
  };

  const startChatWithColleague = async (colleague: Colleague) => {
    try {
      const result = await api.createEmployeeChat(currentUserId, colleague.id, companyId);
      const chatId = result.chat_id || result.id;
      if (chatId) {
        setSelectedChatId(chatId);
        setSelectedPeer({
          id: colleague.id,
          name: `${colleague.first_name} ${colleague.last_name}`,
          position: colleague.position,
          avatar: colleague.avatar_url
        });
        setShowNewChat(false);
        await loadMessages(chatId);
        await loadChats();
      }
    } catch (e) {
      console.error('Failed to create chat:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChatId || !newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await api.sendEmployeeMessage(selectedChatId, currentUserId, newMessage.trim());
      setNewMessage('');
      await loadMessages(selectedChatId);
      await loadChats();
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const filteredColleagues = colleagues.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      (c.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredChats = chats.filter(c =>
    c.peer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-background border rounded-lg overflow-hidden">
      <div className="w-80 border-r flex flex-col bg-muted/30">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Icon name="MessageCircle" size={16} />
              Чаты
              {totalUnread > 0 && (
                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                  {totalUnread}
                </Badge>
              )}
            </h3>
            <Button
              variant={showNewChat ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewChat(!showNewChat)}
              className="h-8"
            >
              <Icon name={showNewChat ? "X" : "Plus"} size={14} />
              <span className="ml-1 text-xs">{showNewChat ? 'Назад' : 'Новый'}</span>
            </Button>
          </div>
          <div className="relative">
            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={showNewChat ? "Найти сотрудника..." : "Поиск..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            filteredColleagues.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Сотрудники не найдены
              </div>
            ) : (
              filteredColleagues.map((colleague) => (
                <div
                  key={colleague.id}
                  onClick={() => startChatWithColleague(colleague)}
                  className="p-3 cursor-pointer hover:bg-muted transition-colors border-b"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {colleague.avatar_url && <AvatarImage src={colleague.avatar_url} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(`${colleague.first_name} ${colleague.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {colleague.first_name} {colleague.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {colleague.position || colleague.department || 'Сотрудник'}
                      </div>
                    </div>
                    <Icon name="MessageSquarePlus" size={16} className="text-muted-foreground" />
                  </div>
                </div>
              ))
            )
          ) : isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="MessagesSquare" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Нет чатов</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewChat(true)}>
                <Icon name="Plus" size={14} className="mr-1" />
                Начать чат
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b ${
                  selectedChatId === chat.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    {chat.peer_avatar && <AvatarImage src={chat.peer_avatar} />}
                    <AvatarFallback className="text-xs">
                      {getInitials(chat.peer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-sm truncate">{chat.peer_name}</span>
                      {chat.last_message_at && (
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                          {formatTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {chat.peer_position || 'Сотрудник'}
                    </div>
                    {chat.last_message && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate pr-2">
                          {chat.last_message}
                        </span>
                        {chat.unread_count > 0 && (
                          <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] shrink-0">
                            {chat.unread_count}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedPeer ? (
          <>
            <div className="px-4 py-3 border-b flex items-center gap-3 bg-muted/20">
              <Avatar className="h-9 w-9">
                {selectedPeer.avatar && <AvatarImage src={selectedPeer.avatar} />}
                <AvatarFallback className="text-xs">
                  {getInitials(selectedPeer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{selectedPeer.name}</div>
                {selectedPeer.position && (
                  <div className="text-xs text-muted-foreground">{selectedPeer.position}</div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <Icon name="MessageCircle" size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Начните диалог с {selectedPeer.name}</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <Avatar className="h-7 w-7 shrink-0">
                            {msg.sender_avatar && <AvatarImage src={msg.sender_avatar} />}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(msg.sender_name || selectedPeer.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div className={`text-[10px] mt-1 ${
                            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          }`}>
                            {formatTime(msg.created_at)}
                            {isOwn && (
                              <span className="ml-1">
                                {msg.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t bg-muted/20">
              <div className="flex gap-2">
                <Input
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                >
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Icon name="MessagesSquare" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">Выберите чат</p>
              <p className="text-sm">или начните новый диалог с коллегой</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
