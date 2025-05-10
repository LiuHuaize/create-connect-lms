import { useState, useEffect } from 'react';
import { Course, CourseModule } from '@/types/course';

interface CourseBackupData {
  course: Course;
  modules: CourseModule[];
  timestamp: number;
}

interface UseLocalBackupProps {
  courseId?: string | null;
  course: Course;
  modules: CourseModule[];
  isLoading: boolean;
  moduleDataLoaded: boolean;
}

interface UseLocalBackupResult {
  hasBackup: boolean;
  saveLocalBackup: () => void;
  restoreFromBackup: () => { course: Course; modules: CourseModule[] } | null;
  clearBackup: () => void;
  backupTimestamp: number | null;
}

/**
 * 本地备份钩子 - 使用localStorage保存课程编辑状态，防止浏览器崩溃导致数据丢失
 */
export const useLocalBackup = ({
  courseId,
  course,
  modules,
  isLoading,
  moduleDataLoaded
}: UseLocalBackupProps): UseLocalBackupResult => {
  const [hasBackup, setHasBackup] = useState(false);
  const [backupTimestamp, setBackupTimestamp] = useState<number | null>(null);

  // 生成备份ID
  const getBackupId = () => {
    return courseId ? `course_backup_${courseId}` : null;
  };

  // 检查是否有可用的本地备份
  useEffect(() => {
    if (!courseId || isLoading || !moduleDataLoaded) return;

    const backupId = getBackupId();
    if (!backupId) return;

    try {
      const backupJson = localStorage.getItem(backupId);
      if (backupJson) {
        const backup = JSON.parse(backupJson) as CourseBackupData;
        setHasBackup(true);
        setBackupTimestamp(backup.timestamp);
      } else {
        setHasBackup(false);
        setBackupTimestamp(null);
      }
    } catch (error) {
      console.error('读取本地备份失败:', error);
      setHasBackup(false);
      setBackupTimestamp(null);
    }
  }, [courseId, isLoading, moduleDataLoaded]);

  // 自动备份课程数据 - 已禁用
  useEffect(() => {
    if (!courseId || isLoading || !moduleDataLoaded) return;

    // 禁用自动备份 - 启动时清除现有备份
    clearBackup();
    
    // 删除旧代码：不再设置定时备份
    // const intervalId = setInterval(() => {
    //   saveLocalBackup();
    // }, 300000); // 从60000(1分钟)改为300000(5分钟)
    // 
    // return () => {
    //   clearInterval(intervalId);
    // };

    // 记录禁用备份的信息
    console.log('自动备份功能已禁用，如需保存请手动点击保存按钮');
    
  }, [courseId, isLoading, moduleDataLoaded]);

  // 保存本地备份
  const saveLocalBackup = () => {
    const backupId = getBackupId();
    if (!backupId || isLoading || !moduleDataLoaded) return;

    try {
      // 进行简单备份，不进行复杂的内容处理
      const backupData: CourseBackupData = {
        course,
        modules,
        timestamp: Date.now()
      };

      // 限制备份大小，避免内存问题
      const backupString = JSON.stringify(backupData);
      if (backupString.length > 2 * 1024 * 1024) { // 超过2MB的备份进行精简
        console.warn('备份数据过大，仅保存基本信息');
        // 只保存课程基本信息和模块标题
        const simplifiedBackup = {
          course: {
            id: course.id,
            title: course.title,
            description: '',
            author_id: course.author_id,
            status: course.status
          },
          modules: modules.map(m => ({
            id: m.id,
            title: m.title,
            order_index: m.order_index,
            course_id: m.course_id,
            lessons: [] // 不保存课时内容
          })),
          timestamp: Date.now()
        };
        localStorage.setItem(backupId, JSON.stringify(simplifiedBackup));
      } else {
        localStorage.setItem(backupId, backupString);
      }

      setHasBackup(true);
      setBackupTimestamp(backupData.timestamp);
      console.log('课程本地备份已保存:', new Date(backupData.timestamp).toLocaleString());
    } catch (error) {
      console.error('保存本地备份失败:', error);
    }
  };

  // 从备份恢复
  const restoreFromBackup = () => {
    const backupId = getBackupId();
    if (!backupId) return null;

    try {
      const backupJson = localStorage.getItem(backupId);
      if (backupJson) {
        const backup = JSON.parse(backupJson) as CourseBackupData;
        console.log('从本地备份恢复课程数据:', new Date(backup.timestamp).toLocaleString());
        return {
          course: backup.course,
          modules: backup.modules
        };
      }
    } catch (error) {
      console.error('从本地备份恢复失败:', error);
    }
    
    return null;
  };

  // 清除备份
  const clearBackup = () => {
    try {
      // 清除特定课程备份
      const backupId = getBackupId();
      if (backupId) {
        localStorage.removeItem(backupId);
      }
      
      // 清除所有以course_backup_开头的localStorage项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('course_backup_')) {
          localStorage.removeItem(key);
          console.log('已清除备份:', key);
        }
      }
      
      setHasBackup(false);
      setBackupTimestamp(null);
      console.log('已清除所有本地备份');
    } catch (error) {
      console.error('清除本地备份失败:', error);
    }
  };

  return {
    hasBackup,
    saveLocalBackup,
    restoreFromBackup,
    clearBackup,
    backupTimestamp
  };
}; 