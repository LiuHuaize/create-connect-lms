import { renderHook, act } from '@testing-library/react';
import { useLocalBackup } from '../../hooks/useLocalBackup';
import { Course, CourseModule } from '@/types/course';

// 模拟localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => {
    return mockLocalStorage.store[key] || null;
  }),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('useLocalBackup', () => {
  // 清除模拟的localStorage
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });
  
  // 模拟数据
  const mockCourse: Course = {
    id: 'course-123',
    title: 'Test Course',
    description: 'Description',
    author_id: 'author1',
    status: 'draft'
  };
  
  const mockModules: CourseModule[] = [
    {
      id: 'm1',
      course_id: 'course-123',
      title: 'Module 1',
      order_index: 0,
      lessons: []
    }
  ];
  
  test('保存本地备份', () => {
    const { result } = renderHook(() => 
      useLocalBackup({
        courseId: 'course-123',
        course: mockCourse,
        modules: mockModules,
        isLoading: false,
        moduleDataLoaded: true
      })
    );
    
    // 初始状态不应有备份
    expect(result.current.hasBackup).toBe(false);
    
    // 保存备份
    act(() => {
      result.current.saveLocalBackup();
    });
    
    // 应调用了localStorage.setItem
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    
    // 第一个参数应是正确的backup ID
    expect(mockLocalStorage.setItem.mock.calls[0][0]).toBe('course_backup_course-123');
    
    // 保存后hasBackup应为true
    expect(result.current.hasBackup).toBe(true);
  });
  
  test('从备份恢复', () => {
    // 设置模拟备份数据
    const backupData = {
      course: mockCourse,
      modules: mockModules,
      timestamp: Date.now()
    };
    
    mockLocalStorage.setItem('course_backup_course-123', JSON.stringify(backupData));
    
    const { result } = renderHook(() => 
      useLocalBackup({
        courseId: 'course-123',
        course: { ...mockCourse, title: 'Different Title' },
        modules: mockModules,
        isLoading: false,
        moduleDataLoaded: true
      })
    );
    
    // 应检测到备份
    expect(result.current.hasBackup).toBe(true);
    
    // 从备份恢复
    let restoredData: any;
    act(() => {
      restoredData = result.current.restoreFromBackup();
    });
    
    // 恢复的数据应与备份数据一致
    expect(restoredData.course).toEqual(mockCourse);
    expect(restoredData.modules).toEqual(mockModules);
  });
  
  test('清除备份', () => {
    // 设置模拟备份数据
    const backupData = {
      course: mockCourse,
      modules: mockModules,
      timestamp: Date.now()
    };
    
    mockLocalStorage.setItem('course_backup_course-123', JSON.stringify(backupData));
    
    const { result } = renderHook(() => 
      useLocalBackup({
        courseId: 'course-123',
        course: mockCourse,
        modules: mockModules,
        isLoading: false,
        moduleDataLoaded: true
      })
    );
    
    // 应检测到备份
    expect(result.current.hasBackup).toBe(true);
    
    // 清除备份
    act(() => {
      result.current.clearBackup();
    });
    
    // 应调用了localStorage.removeItem
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('course_backup_course-123');
    
    // 清除后hasBackup应为false
    expect(result.current.hasBackup).toBe(false);
  });
}); 