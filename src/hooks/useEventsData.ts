import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'online' | 'offline';
  location?: string;
  enrolledCount: number;
  host?: string;
}

export function useEventsData() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    // 模拟从API获取活动数据
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        // 这里应该是从API获取，这里用模拟数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockEvents: Event[] = [
          {
            id: '1',
            title: '产品设计工作坊',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 两天后
            type: 'online',
            enrolledCount: 42,
            host: '张明'
          },
          {
            id: '2',
            title: '行业专家问答会',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 五天后
            type: 'offline',
            location: '创新中心',
            enrolledCount: 28
          },
          {
            id: '3',
            title: '用户体验设计讲座',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 三天后
            type: 'online',
            enrolledCount: 35,
            host: '李婷'
          }
        ];
        
        setEvents(mockEvents);
      } catch (error) {
        console.error('获取活动数据失败:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    if (user) {
      fetchEvents();
    } else {
      setEvents([]);
      setLoadingEvents(false);
    }
  }, [user]);

  return { events, loadingEvents };
}

export default useEventsData; 