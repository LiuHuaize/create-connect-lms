import React, { useState } from 'react';
import { useCourseData } from './course/hooks/useCourseData';
import { useCoursesData } from '@/hooks/useCoursesData';

/**
 * 测试重复请求修复的页面
 * 用于验证第一阶段步骤一的修复效果
 */
const TestDuplicateRequestsFix: React.FC = () => {
  const [courseId, setCourseId] = useState<string>(''); // 先设为空，让用户输入有效的课程ID
  const [testResults, setTestResults] = useState<string[]>([]);

  const { loading, courseData, error } = useCourseData(courseId);
  const { courses, loading: coursesLoading } = useCoursesData(); // 获取可用课程列表

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 添加页面加载标识
  React.useEffect(() => {
    console.log('🧪 测试页面已加载 - TestDuplicateRequestsFix');
    addTestResult('测试页面已加载');
  }, []);

  const clearResults = () => {
    setTestResults([]);
  };

  const testDifferentCourse = () => {
    const testCourseId = '123e4567-e89b-12d3-a456-426614174000'; // 测试用的课程ID
    setCourseId(testCourseId);
    addTestResult(`切换到测试课程ID: ${testCourseId}`);
  };

  const resetToOriginal = () => {
    setCourseId(''); // 重置为空，让用户输入有效ID
    addTestResult('重置课程ID');
  };

  const useFirstAvailableCourse = () => {
    if (courses && courses.length > 0) {
      const firstCourse = courses[0];
      setCourseId(firstCourse.id);
      addTestResult(`使用第一个可用课程: ${firstCourse.title} (${firstCourse.id})`);
    } else {
      addTestResult('没有找到可用课程');
    }
  };

  React.useEffect(() => {
    if (courseId) {
      addTestResult(`课程ID已设置: ${courseId}`);
    }
  }, [courseId]);

  React.useEffect(() => {
    if (loading) {
      addTestResult('开始加载课程数据...');
    } else if (courseData) {
      addTestResult(`课程数据加载成功: ${courseData.title || '未知标题'}`);
    } else if (error) {
      addTestResult(`课程数据加载失败: ${error.message}`);
    }
  }, [loading, courseData, error]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🧪 重复请求修复测试页面
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 控制面板 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">测试控制</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                当前课程ID:
              </label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="输入课程ID"
              />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={useFirstAvailableCourse}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={coursesLoading || !courses || courses.length === 0}
              >
                {coursesLoading ? '加载中...' : '使用第一个可用课程'}
              </button>

              <button
                onClick={testDifferentCourse}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                测试不同课程
              </button>

              <button
                onClick={resetToOriginal}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                重置课程ID
              </button>

              <button
                onClick={clearResults}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                清空测试结果
              </button>
            </div>
            
            {/* 状态显示 */}
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">当前状态:</h3>
              <div className="space-y-1 text-sm">
                <div>加载中: {loading ? '是' : '否'}</div>
                <div>有数据: {courseData ? '是' : '否'}</div>
                <div>有错误: {error ? '是' : '否'}</div>
                {courseData && (
                  <div>课程标题: {courseData.title}</div>
                )}
              </div>
            </div>

            {/* 可用课程列表 */}
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium mb-2">可用课程:</h3>
              {coursesLoading ? (
                <div className="text-sm text-gray-500">加载课程列表中...</div>
              ) : courses && courses.length > 0 ? (
                <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                  {courses.slice(0, 3).map((course) => (
                    <div
                      key={course.id}
                      className="cursor-pointer hover:bg-blue-100 p-1 rounded"
                      onClick={() => {
                        setCourseId(course.id);
                        addTestResult(`选择课程: ${course.title}`);
                      }}
                    >
                      <div className="font-medium">{course.title}</div>
                      <div className="text-xs text-gray-500">{course.id}</div>
                    </div>
                  ))}
                  {courses.length > 3 && (
                    <div className="text-xs text-gray-500">...还有 {courses.length - 3} 个课程</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">没有找到课程</div>
              )}
            </div>
          </div>
          
          {/* 测试结果 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">测试结果日志</h2>
            <div className="bg-black text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
              {testResults.length === 0 ? (
                <div className="text-gray-500">等待测试结果...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* 测试指南 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold mb-2">🔍 测试指南:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>打开浏览器开发者工具的Console标签页</li>
            <li>观察是否只有1次"📚 开始获取课程详情"日志</li>
            <li>检查是否有"🚫 阻止重复的课程数据请求"警告</li>
            <li>验证总加载时间是否从6.9秒降到2秒内</li>
            <li>切换不同课程ID测试缓存效果</li>
          </ol>
        </div>
        
        {/* 成功标志 */}
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <h3 className="font-semibold mb-2">✅ 修复成功的标志:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>控制台只显示1次课程数据请求，不是3次</li>
            <li>页面加载时间显著减少</li>
            <li>没有重复请求的警告日志</li>
            <li>缓存在15分钟内有效</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestDuplicateRequestsFix;
