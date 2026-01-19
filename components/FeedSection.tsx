
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {posts.length > 0 ? (
        posts.map(post => (
          <div key={post.id} className="bg-white rounded-[2rem] overflow-hidden card-shadow border border-orange-50">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-aquarela rounded-full flex items-center justify-center text-white font-black shadow-sm">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{post.authorName}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${getRoleBadge(post.authorRole)}`}>
                        {post.authorRole === UserRole.MANAGER ? 'GESTÃO' : 'PROFESSOR'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xl">{getPostIcon(post.type)}</div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

              {post.attachments && post.attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {post.attachments.map((file, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
                      <span className="text-2xl">
                        {file.type === 'image' ? '🖼️' : file.type === 'video' ? '🎥' : file.type === 'pdf' ? '📄' : '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{file.name}</p>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                        >
                          Visualizar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <button 
                  onClick={() => onLikePost(post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 ${
                    post.likes.includes(currentUserId) 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                  }`}
                >
                  <span className="text-lg">{post.likes.includes(currentUserId) ? '❤️' : '🤍'}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{post.likes.length}</span>
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-[2rem] p-16 text-center text-gray-400 card-shadow border-2 border-dashed border-gray-100">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">📢</span>
          </div>
          <h4 className="text-xl font-bold text-gray-600 mb-2">Mural da Escola</h4>
          <p className="text-sm max-w-xs mx-auto font-medium">Fique por dentro das novidades, eventos e comunicados importantes por aqui.</p>
        </div>
      )}
    </div>
  );
};

export default FeedSection;
