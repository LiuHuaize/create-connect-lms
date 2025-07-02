import React, { useState } from 'react';
import { achievementService } from '../services/achievementService';
import { gamificationService } from '../services/gamificationService';

const TestAchievementLogic: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const testUserId = '97605399-d055-4c40-b23c-d0856081e325';

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testAchievementChecking = async () => {
    setLoading(true);
    addResult('开始测试成就检查逻辑...');

    try {
      // 1. 测试获取所有成就
      addResult('1. 获取所有成就...');
      const allAchievements = await achievementService.getAllAchievements();
      addResult(`   找到 ${allAchievements.length} 个成就`);

      // 2. 测试获取用户已解锁成就
      addResult('2. 获取用户已解锁成就...');
      const userAchievements = await achievementService.getUserAchievements(testUserId);
      addResult(`   用户已解锁 ${userAchievements.length} 个成就`);
      userAchievements.forEach(ua => {
        if (ua.achievement) {
          addResult(`   - ${ua.achievement.title}: ${ua.achievement.description}`);
        }
      });

      // 3. 测试成就检查逻辑
      addResult('3. 运行成就检查逻辑...');
      const newAchievements = await achievementService.checkAllAchievements(testUserId);
      if (newAchievements.length > 0) {
        addResult(`   解锁了 ${newAchievements.length} 个新成就:`);
        newAchievements.forEach(achievement => {
          addResult(`   - ${achievement.title}: ${achievement.description} (+${achievement.experience_reward} EXP)`);
        });
      } else {
        addResult('   没有新成就可以解锁');
      }

      // 4. 测试成就进度计算
      addResult('4. 测试成就进度计算...');
      for (const achievement of allAchievements.slice(0, 5)) { // 只测试前5个
        const progress = await achievementService.getAchievementProgress(testUserId, achievement.id);
        addResult(`   ${achievement.title}: ${progress.progress}/${progress.maxProgress} (${progress.isUnlocked ? '已解锁' : '未解锁'})`);
      }

      addResult('✅ 成就检查逻辑测试完成');
    } catch (error) {
      addResult(`❌ 测试失败: ${error}`);
      console.error('测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSimulateLessonCompletion = async () => {
    setLoading(true);
    addResult('开始测试模拟课时完成...');

    try {
      // 生成有效的UUID
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // 模拟完成一个课时
      const success = await gamificationService.handleLessonComplete(
        testUserId,
        generateUUID(),
        generateUUID(),
        '测试课时',
        'text'
      );

      if (success) {
        addResult('✅ 模拟课时完成成功');
        
        // 检查是否有新成就解锁
        const newAchievements = await achievementService.checkAllAchievements(testUserId);
        if (newAchievements.length > 0) {
          addResult(`🎉 解锁了 ${newAchievements.length} 个新成就:`);
          newAchievements.forEach(achievement => {
            addResult(`   - ${achievement.title}: ${achievement.description}`);
          });
        } else {
          addResult('   没有新成就解锁');
        }
      } else {
        addResult('❌ 模拟课时完成失败');
      }
    } catch (error) {
      addResult(`❌ 测试失败: ${error}`);
      console.error('测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSimulateQuizCompletion = async () => {
    setLoading(true);
    addResult('开始测试模拟测验完成...');

    try {
      // 生成有效的UUID
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // 模拟完成一个满分测验
      const success = await gamificationService.handleLessonComplete(
        testUserId,
        generateUUID(),
        generateUUID(),
        '测试测验',
        'quiz',
        100
      );

      if (success) {
        addResult('✅ 模拟测验完成成功（100分）');
        
        // 检查是否有新成就解锁
        const newAchievements = await achievementService.checkAllAchievements(testUserId);
        if (newAchievements.length > 0) {
          addResult(`🎉 解锁了 ${newAchievements.length} 个新成就:`);
          newAchievements.forEach(achievement => {
            addResult(`   - ${achievement.title}: ${achievement.description}`);
          });
        } else {
          addResult('   没有新成就解锁');
        }
      } else {
        addResult('❌ 模拟测验完成失败');
      }
    } catch (error) {
      addResult(`❌ 测试失败: ${error}`);
      console.error('测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">成就系统逻辑测试</h1>
            <p className="mt-1 text-sm text-gray-600">测试成就检查和解锁逻辑</p>
          </div>

          <div className="p-6">
            {/* 测试按钮 */}
            <div className="mb-6 space-x-4">
              <button
                onClick={testAchievementChecking}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '测试中...' : '测试成就检查逻辑'}
              </button>
              
              <button
                onClick={testSimulateLessonCompletion}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '测试中...' : '模拟课时完成'}
              </button>
              
              <button
                onClick={testSimulateQuizCompletion}
                disabled={loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? '测试中...' : '模拟测验完成'}
              </button>

              <button
                onClick={clearResults}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                清除结果
              </button>
            </div>

            {/* 测试结果 */}
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="mb-2 text-gray-300">测试结果:</div>
              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-gray-500">点击上方按钮开始测试...</div>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAchievementLogic;
