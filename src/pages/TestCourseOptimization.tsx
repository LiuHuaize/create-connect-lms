import React, { useState } from 'react';
import { courseService } from '../services/courseService';

interface TestResult {
  traditional: { time: number; dataSize: number };
  optimized: { time: number; dataSize: number };
  improvement: { time: string; dataSize: string };
}

const TestCourseOptimization: React.FC = () => {
  const [courseId, setCourseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    if (!courseId) {
      setError('请输入课程ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const performanceResults = await courseService.compareCourseLoading(courseId);
      setResults(performanceResults);
    } catch (err) {
      setError(`测试失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">课程加载性能测试</h1>
      
      <div className="mb-6">
        <label className="block mb-2">
          课程ID:
          <input
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="ml-2 px-3 py-2 border rounded"
            placeholder="输入课程ID"
          />
        </label>
        <button
          onClick={handleRunTest}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? '测试中...' : '运行测试'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          错误: {error}
        </div>
      )}
      
      {results && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">测试结果</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">指标</th>
                  <th className="py-2 px-4 border">传统方法</th>
                  <th className="py-2 px-4 border">优化方法</th>
                  <th className="py-2 px-4 border">性能提升</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border font-medium">加载时间 (ms)</td>
                  <td className="py-2 px-4 border">{results.traditional.time.toFixed(2)}</td>
                  <td className="py-2 px-4 border">{results.optimized.time.toFixed(2)}</td>
                  <td className="py-2 px-4 border font-bold text-green-600">{results.improvement.time}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border font-medium">数据大小 (bytes)</td>
                  <td className="py-2 px-4 border">{results.traditional.dataSize.toLocaleString()}</td>
                  <td className="py-2 px-4 border">{results.optimized.dataSize.toLocaleString()}</td>
                  <td className="py-2 px-4 border font-bold text-green-600">{results.improvement.dataSize}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">优化总结</h3>
            <p>
              优化后的课程加载方法相比传统方法，加载时间减少了{results.improvement.time}，
              数据大小减少了{results.improvement.dataSize}。这将显著改善用户体验，特别是在移动设备或网络
              条件不佳的情况下。
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">优化方案说明</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>传统方法: 一次性加载所有模块和课时数据，导致数据量大、内存占用高</li>
          <li>优化方法: 智能加载策略，只加载当前模块和相邻模块的完整课时，其他模块只加载基本信息</li>
          <li>针对大型课时内容(&gt;50KB)进行智能简化，仅在需要时加载完整内容</li>
          <li>分批加载技术，每批加载1个模块，并在批次间添加延迟，避免内存溢出</li>
          <li>使用服务端数据过滤，减少客户端处理负担</li>
        </ul>
      </div>
    </div>
  );
};

export default TestCourseOptimization; 