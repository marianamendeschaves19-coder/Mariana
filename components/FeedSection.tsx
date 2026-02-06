
import React from 'react';
import { FeedPost, UserRole } from '../types';

interface FeedSectionProps {
  posts: FeedPost[];
  onLikePost: (postId: string) => void;
  currentUserId: string;
}

const FeedSection: React.FC<FeedSectionProps> = ({ posts, onLikePost, currentUserId }) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER: return 'bg-purple-100 text-purple-600';
      case UserRole.TEACHER: return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'calendar': return '📅';
      case 'event': return '🎉';
      case 'alert': return '⚠️';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-['Quicksand']">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden card-shadow border border-orange-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-aquarela rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-inner">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{post.authorName}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${getRoleBadge(post.authorRole)}`}>
                        {post.authorRole === UserRole.MANAGER ? 'GESTÃO' : 'PROFESSOR'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl drop-shadow-sm">{getPostIcon(post.type)}</div>
              </div>

              <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">{post.title}</h3>
              <p className="text-gray-600 text-sm font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Área de Anexos */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="space-y-3 mb-6">
                  {post.attachments.map((file, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/50">
                      {file.type === 'image' && (
                        <div className="relative group">
                          <img 
                            src={file.url} 
                            alt={file.name} 
                            className="w-full h-auto max-h-[400px] object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                            onClick={() => window.open(file.url, '_blank')}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                            <p className="text-[10px] text-white font-bold truncate">{file.name}</p>
                          </div>
                        </div>
                      )}
                      
                      {file.type === 'video' && (
                        <div className="p-1">
                          <video 
                            src={file.url} 
                            controls 
                            className="w-full rounded-xl bg-black max-h-[400px]"
                          />
                          <p className="text-[10px] text-gray-400 font-bold p-2 truncate">{file.name}</p>
                        </div>
                      )}

                      {(file.type === 'pdf' || file.type === 'other') && (
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{file.type === 'pdf' ? '📄' : '📎'}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-700 truncate">{file.name}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-black">{file.type === 'pdf' ? 'Documento PDF' : 'Arquivo'}</p>
                            </div>
                          </div>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-white px-4 py-2 rounded-xl text-[9px] font-black text-orange-500 uppercase tracking-widest border border-orange-100 shadow-sm hover:bg-orange-50 transition-colors"
                          >
                            Abrir
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <button 
                  onClick={() => onLikePost(post.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all active:scale-95 group ${
                    post.likes.includes(currentUserId) 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                  }`}
                >
                  <span className={`text-lg transition-transform group-hover:scale-125 ${post.likes.includes(currentUserId) ? 'animate-pulse' : ''}`}>
                    {post.likes.includes(currentUserId) ? '❤️' : '🤍'}
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{post.likes.length}</span>
                </button>
                <div className="flex -space-x-2">
                   {/* Simulação de avatares de quem curtiu */}
                   {post.likes.slice(0, 3).map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
                   ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-[3rem] p-16 text-center text-gray-400 card-shadow border-2 border-dashed border-orange-50">
          <div className="bg-orange-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner">
            <span className="text-5xl drop-shadow-md">📢</span>
          </div>
          <h4 className="text-xl font-black text-gray-800 mb-2">Mural Vazio</h4>
          <p className="text-sm max-w-xs mx-auto font-bold text-gray-400">Fique atento! Novidades, comunicados e fotos das atividades aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
};

export default FeedSection;
