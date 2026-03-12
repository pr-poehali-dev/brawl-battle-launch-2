import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Employee, ChatMessage } from '@/types';

interface MessengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  currentUserId: number;
  userRole: 'employer' | 'employee';
}

export function MessengerDialog({ open, onOpenChange, employees, currentUserId, userRole }: MessengerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [chatHistories, setChatHistories] = useState<{[key: number]: ChatMessage[]}>({});
  const [employeeStatuses, setEmployeeStatuses] = useState<{[key: number]: {online: boolean; lastSeen?: string; typing?: boolean}}>({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employees.length > 0) {
      const statuses: {[key: number]: {online: boolean; lastSeen?: string}} = {};
      const histories: {[key: number]: ChatMessage[]} = {};
      
      employees.forEach((emp, idx) => {
        statuses[emp.id] = {
          online: idx % 3 === 0,
          lastSeen: idx % 3 !== 0 ? (idx % 2 === 0 ? '5 мин назад' : '2 ч назад') : undefined
        };
        
        if (idx === 0) {
          histories[emp.id] = [
            { id: 1, senderId: emp.id, senderName: emp.name, message: 'Здравствуйте! Как дела с рекомендациями?', timestamp: '10:30', isOwn: false },
            { id: 2, senderId: currentUserId, senderName: 'Вы', message: 'Отлично! У меня есть кандидат на вакансию Frontend Developer', timestamp: '10:32', isOwn: true },
            { id: 3, senderId: emp.id, senderName: emp.name, message: 'Отлично! Отправьте резюме пожалуйста', timestamp: '10:35', isOwn: false },
            { id: 4, senderId: currentUserId, senderName: 'Вы', message: 'Вот резюме кандидата', timestamp: '10:37', isOwn: true, attachments: [{ type: 'file', url: '#', name: 'resume_ivan_petrov.pdf', size: 245000 }] },
            { id: 5, senderId: currentUserId, senderName: 'Вы', message: 'И фото с последнего проекта', timestamp: '10:38', isOwn: true, attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', name: 'project_screenshot.png', size: 892000 }] },
          ];
        } else if (idx === 1) {
          histories[emp.id] = [
            { id: 1, senderId: emp.id, senderName: emp.name, message: 'Добрый день! Есть интересный кандидат', timestamp: '11:20', isOwn: false },
          ];
        }
      });
      
      setEmployeeStatuses(statuses);
      setChatHistories(histories);
    }
  }, [employees, currentUserId]);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnreadCount = (employeeId: number) => {
    const messages = chatHistories[employeeId] || [];
    return messages.filter(m => !m.isOwn && !m.read).length;
  };

  const getLastMessage = (employeeId: number) => {
    const messages = chatHistories[employeeId] || [];
    if (messages.length === 0) return null;
    const lastMsg = messages[messages.length - 1];
    return {
      text: lastMsg.message || (lastMsg.attachments ? '📎 Вложение' : ''),
      timestamp: lastMsg.timestamp
    };
  };

  const handleSendMessage = () => {
    if (!selectedEmployee || (!newMessage.trim() && selectedFiles.length === 0)) return;
    
    const attachments = selectedFiles.map(file => ({
      type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    
    const currentMessages = chatHistories[selectedEmployee.id] || [];
    const newMsg: ChatMessage = {
      id: currentMessages.length + 1,
      senderId: currentUserId,
      senderName: 'Вы',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
    setChatHistories({
      ...chatHistories,
      [selectedEmployee.id]: [...currentMessages, newMsg]
    });
    setNewMessage('');
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const currentMessages = selectedEmployee ? (chatHistories[selectedEmployee.id] || []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[700px] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" className="w-5 h-5" />
            Сообщения
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Поиск сотрудников..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredEmployees.map((emp) => {
                const lastMsg = getLastMessage(emp.id);
                const unreadCount = getUnreadCount(emp.id);
                const status = employeeStatuses[emp.id];
                
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                      selectedEmployee?.id === emp.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {status?.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-sm truncate">{emp.name}</span>
                          {lastMsg && (
                            <span className="text-xs text-muted-foreground ml-2">{lastMsg.timestamp}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">{emp.position}</div>
                        {lastMsg && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground truncate">{lastMsg.text}</span>
                            {unreadCount > 0 && (
                              <Badge variant="default" className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        )}
                        {!status?.online && status?.lastSeen && (
                          <div className="text-xs text-muted-foreground mt-1">был(а) {status.lastSeen}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedEmployee ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{selectedEmployee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {employeeStatuses[selectedEmployee.id]?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{selectedEmployee.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedEmployee.position}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {currentMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-4 py-2`}>
                        <div className="text-xs opacity-70 mb-1">{msg.senderName}</div>
                        {msg.message && <div className="text-sm">{msg.message}</div>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment, idx) => (
                              <div key={idx}>
                                {attachment.type === 'image' ? (
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name}
                                    className="rounded max-w-full h-auto cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  />
                                ) : (
                                  <a 
                                    href={attachment.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded ${msg.isOwn ? 'bg-primary-foreground/10' : 'bg-background'} hover:opacity-80 transition-opacity`}
                                  >
                                    <Icon name="FileText" size={16} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">{attachment.name}</div>
                                      <div className="text-xs opacity-70">{(attachment.size / 1024).toFixed(0)} KB</div>
                                    </div>
                                    <Icon name="Download" size={14} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}
                  {employeeStatuses[selectedEmployee.id]?.typing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="text-sm text-muted-foreground">печатает...</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t space-y-2">
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted rounded px-2 py-1 text-xs">
                          <Icon name={file.type.startsWith('image/') ? 'Image' : 'FileText'} size={14} />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button 
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                            className="hover:text-destructive"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      multiple 
                      className="hidden" 
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name="Paperclip" size={18} />
                    </Button>
                    <Input 
                      placeholder="Введите сообщение..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Icon name="Send" size={18} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Icon name="MessageCircle" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Выберите сотрудника, чтобы начать общение</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
