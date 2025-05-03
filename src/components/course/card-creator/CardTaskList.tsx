import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ExternalLink } from 'lucide-react';
import { CardCreatorTask } from '@/types/card-creator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/useConfirm';

interface CardTaskListProps {
  courseId: string;
  isTeacher: boolean;
  onCreateTask: () => void;
  onEditTask: (task: CardCreatorTask) => void;
}

export const CardTaskList: React.FC<CardTaskListProps> = ({
  courseId,
  isTeacher,
  onCreateTask,
  onEditTask
}) => {
  const [tasks, setTasks] = useState<CardCreatorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { confirmDelete } = useConfirm();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('card_creator_tasks')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setTasks(data as CardCreatorTask[]);
      } catch (error) {
        console.error('Error fetching card tasks:', error);
        toast.error('获取卡片任务失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [courseId]);

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = await confirmDelete('确定要删除这个卡片任务吗？', '此操作无法撤销，所有学生提交的卡片也将被删除。');
    
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('card_creator_tasks')
          .delete()
          .eq('id', taskId);
          
        if (error) throw error;
        
        setTasks(tasks.filter(task => task.id !== taskId));
        toast.success('卡片任务已删除');
      } catch (error) {
        console.error('Error deleting card task:', error);
        toast.error('删除卡片任务失败');
      }
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">加载任务中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 创建卡片按钮已隐藏 */}
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500">暂无卡片制作任务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.instructions}</p>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/course/${courseId}/card-creator/${task.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    打开
                  </Button>
                  
                  {isTeacher && (
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTask(task)}
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        编辑
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 