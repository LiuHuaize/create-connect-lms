import { renderHook, act } from '@testing-library/react';
import { useCourseHistory } from '../../hooks/useCourseHistory';
import { Course, CourseModule } from '@/types/course';

describe('useCourseHistory', () => {
  // 模拟数据
  const mockCourse: Course = {
    id: '1',
    title: 'Test Course',
    description: 'Description',
    author_id: 'author1',
    status: 'draft'
  };
  
  const mockModules: CourseModule[] = [
    {
      id: 'm1',
      course_id: '1',
      title: 'Module 1',
      order_index: 0,
      lessons: []
    }
  ];
  
  // 基本测试
  test('初始状态应包含提供的课程和模块', () => {
    const { result } = renderHook(() => 
      useCourseHistory({
        course: mockCourse,
        modules: mockModules,
        isLoading: false,
        moduleDataLoaded: true
      })
    );
    
    // 初始状态应该没有能撤销的历史
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
  
  // 测试撤销/重做流程
  test('修改状态后应能撤销和重做', () => {
    const setCourse = jest.fn();
    const setModules = jest.fn();
    
    const { result, rerender } = renderHook(
      (props) => useCourseHistory({
        course: props.course,
        modules: props.modules,
        isLoading: false,
        moduleDataLoaded: true
      }),
      { 
        initialProps: { 
          course: mockCourse, 
          modules: mockModules
        } 
      }
    );
    
    // 模拟状态更新
    const updatedCourse = { ...mockCourse, title: 'Updated Course' };
    
    // 重新渲染钩子使用新的课程
    rerender({
      course: updatedCourse,
      modules: mockModules
    });
    
    // 现在应该可以撤销，但不能重做
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    
    // 模拟撤销操作
    act(() => {
      result.current.setCourse = setCourse;
      result.current.setModules = setModules;
      result.current.handleUndo();
    });
    
    // 应该调用了setCourse并传递了原始值
    expect(setCourse).toHaveBeenCalled();
    
    // 应该调用了setModules
    expect(setModules).toHaveBeenCalled();
  });
}); 