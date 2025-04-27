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

  // 自动备份课程数据
  useEffect(() => {
    if (!courseId || isLoading || !moduleDataLoaded) return;

    // 在课程加载完成后，定时保存备份
    const intervalId = setInterval(() => {
      saveLocalBackup();
    }, 60000); // 每分钟保存一次

    return () => {
      clearInterval(intervalId);
    };
  }, [courseId, course, modules, isLoading, moduleDataLoaded]);

  // 保存本地备份
  const saveLocalBackup = () => {
    const backupId = getBackupId();
    if (!backupId || isLoading || !moduleDataLoaded) return;

    try {
      const backupData: CourseBackupData = {
        course,
        modules,
        timestamp: Date.now()
      };

      localStorage.setItem(backupId, JSON.stringify(backupData));
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
    const backupId = getBackupId();
    if (!backupId) return;

    try {
      localStorage.removeItem(backupId);
      setHasBackup(false);
      setBackupTimestamp(null);
      console.log('已清除本地备份');
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