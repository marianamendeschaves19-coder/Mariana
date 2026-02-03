
import React, { useState, useRef } from 'react';
import { FeedPost } from '../types';

interface CreatePostFormProps {
  onCreatePost: (post: Omit<FeedPost, 'id' | 'authorId' | 'authorName' | 'authorRole' | 'likes' | 'createdAt'>) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onCreatePost }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<FeedPost['type']>('general');
  const [attachments, setAttachments] = useState<FeedPost['attachments']>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'other';
        setAttachments(prev => [...prev, { name: file.name, url: event.target?.result as string || '#', type: fileType as any }]);
      };
      if (file.type.startsWith('image/')) reader.readAsDataURL(file);
      else setAttachments(prev => [...prev, { name: file.name, url: '#', type: (file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'other') as any }]);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    onCreatePost({ title, content, type, attachments });
    setTitle(''); setContent(''); setType('general'); setAttachments([]);
    alert("Publicado!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 card-shadow border border-orange-50 mb-8 max-w-2xl mx-auto font-['Quicksand']">
      <h3 className="text-xl font-black text-gray-800 mb-6">📢 Nova Publicação</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200" />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200">
            <option value="general">Informativo</option><option value="calendar">Calendário</option><option value="event">Evento</option><option value="alert">Aviso</option>
          </select>
        </div>
        <textarea placeholder="Escreva a mensagem..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:border-orange-200 resize-none" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase hover:border-orange-200 hover:text-orange-500">📎 Adicionar Anexos</button>
        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
        <button type="submit" disabled={!title || !content} className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl text-xs uppercase shadow-xl hover:scale-105 transition-all">POSTAR AGORA</button>
      </div>
    </form>
  );
};

export default CreatePostForm;
