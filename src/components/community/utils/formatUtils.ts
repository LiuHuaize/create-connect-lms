
import { format, formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    const relativeTime = formatDistance(date, now, { 
      addSuffix: true, 
      locale: zhCN 
    });
    
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    }
    
    return relativeTime;
  } catch (e) {
    return dateString;
  }
};

export const getAvatarInitials = (username: string = '未知用户') => {
  return username.substring(0, 2);
};

export const getAvatarBgColor = (userId: string) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-yellow-100 text-yellow-700',
    'bg-red-100 text-red-700',
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
  ];
  
  const charSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const colorIndex = charSum % colors.length;
  
  return colors[colorIndex];
};
