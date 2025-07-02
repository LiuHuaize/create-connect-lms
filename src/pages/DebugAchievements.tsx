import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DebugAchievements: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDirectSupabaseCall = async () => {
    setLoading(true);
    addResult('开始测试直接 Supabase 调用...');

    try {
      // 1. 测试获取成就数据
      addResult('1. 测试获取成就数据...');
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('achievement_type', { ascending: true });

      if (achievementsError) {
        addResult(`   ❌ 获取成就失败: ${achievementsError.message}`);
        addResult(`   错误详情: ${JSON.stringify(achievementsError)}`);
      } else {
        addResult(`   ✅ 成功获取 ${achievements?.length || 0} 个成就`);
        if (achievements && achievements.length > 0) {
          achievements.slice(0, 3).forEach(achievement => {
            addResult(`   - ${achievement.title}: ${achievement.description}`);
          });
        }
      }

      // 2. 测试获取用户成就数据
      const testUserId = '97605399-d055-4c40-b23c-d0856081e325';
      addResult('2. 测试获取用户成就数据...');
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', testUserId);

      if (userError) {
        addResult(`   ❌ 获取用户成就失败: ${userError.message}`);
        addResult(`   错误详情: ${JSON.stringify(userError)}`);
      } else {
        addResult(`   ✅ 成功获取用户 ${userAchievements?.length || 0} 个成就`);
        if (userAchievements && userAchievements.length > 0) {
          userAchievements.forEach(ua => {
            if (ua.achievement) {
              addResult(`   - ${ua.achievement.title}: ${ua.achievement.description}`);
            }
          });
        }
      }

      // 3. 测试获取用户学习数据
      addResult('3. 测试获取用户学习数据...');
      const { data: completions, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('id, score')
        .eq('user_id', testUserId);

      if (completionsError) {
        addResult(`   ❌ 获取学习数据失败: ${completionsError.message}`);
      } else {
        addResult(`   ✅ 用户完成了 ${completions?.length || 0} 个课时`);
        const perfectScores = completions?.filter(c => c.score === 100).length || 0;
        addResult(`   - 其中 ${perfectScores} 个获得满分`);
      }

      // 4. 测试连接状态
      addResult('4. 测试 Supabase 连接状态...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult(`   ❌ 认证检查失败: ${authError.message}`);
      } else {
        addResult(`   ✅ 认证状态: ${user ? '已登录' : '未登录'}`);
        if (user) {
          addResult(`   - 用户ID: ${user.id}`);
          addResult(`   - 用户邮箱: ${user.email}`);
        }
      }

      addResult('✅ 调试测试完成');
    } catch (error) {
      addResult(`❌ 测试失败: ${error}`);
      console.error('调试测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAchievementService = async () => {
    setLoading(true);
    addResult('开始测试成就服务...');

    try {
      // 动态导入成就服务
      const { achievementService } = await import('../services/achievementService');
      
      addResult('1. 测试 getAllAchievements...');
      const achievements = await achievementService.getAllAchievements();
      addResult(`   结果: ${achievements.length} 个成就`);
      
      if (achievements.length > 0) {
        achievements.slice(0, 3).forEach(achievement => {
          addResult(`   - ${achievement.title}: ${achievement.description}`);
        });
      }

      const testUserId = '97605399-d055-4c40-b23c-d0856081e325';
      addResult('2. 测试 getUserAchievements...');
      const userAchievements = await achievementService.getUserAchievements(testUserId);
      addResult(`   结果: ${userAchievements.length} 个用户成就`);

      if (userAchievements.length > 0) {
        userAchievements.forEach(ua => {
          if (ua.achievement) {
            addResult(`   - ${ua.achievement.title}: ${ua.achievement.description}`);
          }
        });
      }

      addResult('✅ 成就服务测试完成');
    } catch (error) {
      addResult(`❌ 成就服务测试失败: ${error}`);
      console.error('成就服务测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">成就系统调试</h1>
            <p className="mt-1 text-sm text-gray-600">调试成就系统的 API 调用</p>
          </div>

          <div className="p-6">
            {/* 测试按钮 */}
            <div className="mb-6 space-x-4">
              <button
                onClick={testDirectSupabaseCall}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '测试中...' : '测试直接 Supabase 调用'}
              </button>
              
              <button
                onClick={testAchievementService}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '测试中...' : '测试成就服务'}
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
              <div className="mb-2 text-gray-300">调试结果:</div>
              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-gray-500">点击上方按钮开始调试...</div>
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

export default DebugAchievements;
