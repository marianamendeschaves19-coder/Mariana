
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
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setIsReading(true);
    const fileList = Array.from(files);
    let loadedCount = 0;

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileType = file.type.startsWith('image/') 
          ? 'image' 
          : file.type.startsWith('video/') 
            ? 'video' 
            : file.type === 'application/pdf' 
              ? 'pdf' 
              : 'other';

        setAttachments(prev => [...prev, { 
          name: file.name, 
          url: event.target?.result as string || '#', 
          type: fileType as any 
        }]);

        loadedCount++;
        if (loadedCount === fileList.length) setIsReading(false);
      };
      
      // Lê todos os tipos como DataURL para permitir exibição direta
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    onCreatePost({ title, content, type, attachments });
    setTitle(''); 
    setContent(''); 
    setType('general'); 
    setAttachments([]);
    alert("Publicado no mural com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 card-shadow border border-orange-50 mb-8 max-w-2xl mx-auto font-['Quicksand']">
      <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">📢</span> Nova Publicação
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Título do comunicado" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black outline-none border border-transparent focus:border-orange-200" 
          />
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as any)} 
            className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border border-transparent outline-none focus:border-orange-200"
          >
            <option value="general">Informativo Geral</option>
            <option value="calendar">Calendário Escolar</option>
            <option value="event">Evento Especial</option>
            <option value="alert">Aviso Urgente</option>
          </select>
        </div>
        
        <textarea 
          placeholder="Escreva sua mensagem aqui..." 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          rows={4} 
          className="w-full p-4 rounded-2xl bg-gray-50 text-sm font-bold text-black border-transparent outline-none focus:border-orange-200 resize-none min-h-[120px]" 
        />

        {/* Lista de Anexos Pendentes */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="relative group bg-orange-50 p-2 rounded-xl border border-orange-100 flex items-center gap-2">
                <span className="text-lg">
                  {file.type === 'image' ? '🖼️' : file.type === 'video' ? '🎥' : file.type === 'pdf' ? '📄' : '📎'}
                </span>
                <span className="text-[10px] font-bold text-orange-700 truncate flex-1">{file.name}</span>
                <button 
                  type="button" 
                  onClick={() => removeAttachment(idx)}
                  className="bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center hover:scale-110 transition-transform"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isReading}
          className={`w-full py-3 border-2 border-dashed rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isReading ? 'bg-gray-100 border-gray-200 text-gray-400' : 'border-orange-100 text-orange-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30'}`}
        >
          {isReading ? 'Processando arquivos...' : '📎 Adicionar Fotos, Vídeos ou PDFs'}
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*,video/*,application/pdf"
          onChange={handleFileChange} 
        />
        
        <button 
          type="submit" 
          disabled={!title || !content || isReading} 
          className="w-full py-5 gradient-aquarela text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          POSTAR NO MURAL
        </button>
      </div>
    </form>
  );
};

export default CreatePostForm;
