
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
        const fileType = file.type.startsWith('image/') ? 'image' 
                        : file.type.startsWith('video/') ? 'video'
                        : file.type === 'application/pdf' ? 'pdf' : 'other';
        
        const newAttachment = {
          name: file.name,
          url: event.target?.result as string || '#',
          type: fileType as any
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, {
          name: file.name,
          url: '#',
          type: (file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'other') as any
        }]);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    onCreatePost({ title, content, type, attachments });
    setTitle(''); setContent(''); setType('general'); setAttachments([]);
    alert("Publicação enviada!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 card-shadow border border-orange-50 mb-8 max-w-2xl mx-auto">
      <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">📢</span> Nova Publicação no Mural
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-orange-400 ml-1 uppercase tracking-widest">Título</label>
            <input 
              type="text" 
              placeholder="Ex: Comunicado Geral" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-orange-400 ml-1 uppercase tracking-widest">Categoria</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as any)} 
              className="w-full p-3 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200"
            >
              <option value="general">Geral / Informativo</option>
              <option value="calendar">Calendário Escolar</option>
              <option value="event">Evento / Festa</option>
              <option value="alert">Aviso Importante</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-orange-400 ml-1 uppercase tracking-widest">Mensagem</label>
          <textarea 
            placeholder="Escreva aqui os detalhes..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows={4}
            className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200 transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-orange-400 ml-1 uppercase tracking-widest">Anexos</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((at, i) => (
              <div key={i} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase">
                <span>{at.type === 'image' ? '🖼️' : at.type === 'video' ? '🎥' : at.type === 'pdf' ? '📄' : '📎'}</span>
                <span className="max-w-[100px] truncate">{at.name}</span>
                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-200 hover:text-orange-400 transition-all uppercase tracking-widest"
          >
            <span>➕ Adicionar Arquivos (Imagens, Videos, PDF)</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
        </div>

        <button type="submit" disabled={!title || !content} className="w-full py-4 gradient-aquarela text-white font-black rounded-2xl text-xs uppercase shadow-xl hover:scale-105 transition-all disabled:opacity-50">PUBLICAR NO MURAL</button>
      </div>
    </form>
  );
};

export default CreatePostForm;
