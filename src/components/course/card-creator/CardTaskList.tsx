import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { CardCreatorTask } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface CardTaskListProps {
  courseId: string;
  isTeacher?: boolean;
  onCreateTask?: () => void;
  onEditTask?: (task: CardCreatorTask) => void;
}

export function CardTaskList({ courseId, isTeacher = false, onCreateTask, onEditTask }: CardTaskListProps) {
  const [tasks, setTasks] = useState<CardCreatorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTasks();
  }, [courseId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const tasks = await CardCreatorService.getTasksByCourse(courseId);
      setTasks(tasks);
    } catch (error) {
      console.error('Error loading card creator tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    
    try {
      const success = await CardCreatorService.deleteTask(taskId);
      if (success) {
        setTasks(tasks => tasks.filter(task => task.id !== taskId));
      } else {
        throw new Error('删除任务失败');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('删除任务失败，请重试');
    }
  };

  const handleOpenTask = (task: CardCreatorTask) => {
    router.push(`/course/${courseId}/card-creator/${task.id}`);
  };

  return (
    <div className="card-task-list space-y-4">
      {isTeacher && (
        <div className="flex justify-end">
          <Button onClick={onCreateTask} className="flex items-center space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>创建新卡片任务</span>
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {isTeacher 
            ? '暂无卡片创建任务，点击上方按钮创建第一个任务'
            : '本课程暂无卡片创建任务'
          }
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">{task.title}</h3>
                {isTeacher && (
                  <div className="flex space-x-2">
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => onEditTask?.(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-600" 
                      onClick={() => handleDeleteTask(task.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {task.instructions}
              </p>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">
                  创建时间: {new Date(task.created_at || '').toLocaleDateString()}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenTask(task)}
                >
                  {isTeacher ? '查看详情' : '开始任务'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 