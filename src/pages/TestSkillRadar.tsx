import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  gamificationService, 
  SkillType, 
  SKILL_CONFIG 
} from '@/services/gamificationService';
import { supabase } from '@/integrations/supabase/client';
import SkillRadarChart from '@/components/gamification/SkillRadarChart';
import SkillDetails from '@/components/gamification/SkillDetails';
import { 
  TestTube, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Target
} from 'lucide-react';

const TestSkillRadar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 获取当前用户
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // 显示消息
  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // 初始化用户技能
  const initializeSkills = async () => {
    if (!currentUserId) {
      showMessage('请先登录', 'error');
      return;
    }

    setLoading(true);
    try {
      const skills = await gamificationService.initializeUserSkills(currentUserId);
      if (skills.length > 0) {
        showMessage(`成功初始化 ${skills.length} 个技能`, 'success');
      } else {
        showMessage('技能初始化失败', 'error');
      }
    } catch (error) {
      console.error('初始化技能失败:', error);
      showMessage('技能初始化失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 添加随机技能经验
  const addRandomExperience = async () => {
    if (!currentUserId) {
      showMessage('请先登录', 'error');
      return;
    }

    setLoading(true);
    try {
      const skillTypes: SkillType[] = [
        'communication',
        'collaboration', 
        'critical_thinking',
        'creativity',
        'computational_thinking',
        'leadership'
      ];

      // 随机选择一个技能
      const randomSkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
      const randomExp = Math.floor(Math.random() * 30) + 10; // 10-40 经验值

      const success = await gamificationService.addSkillExperience(
        currentUserId,
        randomSkill,
        randomExp,
        'test',
        undefined,
        '测试添加经验值'
      );

      if (success) {
        const skillConfig = SKILL_CONFIG[randomSkill];
        showMessage(`成功为 ${skillConfig.label} 添加 ${randomExp} 经验值`, 'success');
      } else {
        showMessage('添加经验值失败', 'error');
      }
    } catch (error) {
      console.error('添加经验值失败:', error);
      showMessage('添加经验值失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 添加特定技能经验
  const addSpecificExperience = async (skillType: SkillType, experience: number) => {
    if (!currentUserId) {
      showMessage('请先登录', 'error');
      return;
    }

    setLoading(true);
    try {
      const success = await gamificationService.addSkillExperience(
        currentUserId,
        skillType,
        experience,
        'test',
        undefined,
        `测试添加 ${experience} 经验值`
      );

      if (success) {
        const skillConfig = SKILL_CONFIG[skillType];
        showMessage(`成功为 ${skillConfig.label} 添加 ${experience} 经验值`, 'success');
      } else {
        showMessage('添加经验值失败', 'error');
      }
    } catch (error) {
      console.error('添加经验值失败:', error);
      showMessage('添加经验值失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 重置所有技能
  const resetAllSkills = async () => {
    if (!currentUserId) {
      showMessage('请先登录', 'error');
      return;
    }

    if (!confirm('确定要重置所有技能吗？这将删除所有技能数据！')) {
      return;
    }

    setLoading(true);
    try {
      // 删除所有技能记录
      const { error: deleteSkillsError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', currentUserId);

      if (deleteSkillsError) {
        throw deleteSkillsError;
      }

      // 删除所有技能经验日志
      const { error: deleteLogsError } = await supabase
        .from('skill_experience_logs')
        .delete()
        .eq('user_id', currentUserId);

      if (deleteLogsError) {
        throw deleteLogsError;
      }

      showMessage('成功重置所有技能', 'success');
    } catch (error) {
      console.error('重置技能失败:', error);
      showMessage('重置技能失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">请先登录以测试技能雷达图功能</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TestTube className="h-8 w-8 text-blue-500" />
            技能雷达图测试页面
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            这个页面用于测试技能雷达图组件的功能。您可以初始化技能、添加经验值、查看雷达图等。
          </p>
          
          {/* 消息提示 */}
          {message && (
            <Alert className={`mb-4 ${
              messageType === 'success' ? 'border-green-500 bg-green-50' :
              messageType === 'error' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <AlertDescription className={
                messageType === 'success' ? 'text-green-700' :
                messageType === 'error' ? 'text-red-700' :
                'text-blue-700'
              }>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={initializeSkills} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              初始化技能
            </Button>
            
            <Button 
              onClick={addRandomExperience} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              添加随机经验值
            </Button>
            
            <Button 
              onClick={resetAllSkills} 
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重置所有技能
            </Button>
          </div>

          {/* 快速添加经验值 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">快速添加经验值</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(SKILL_CONFIG).map(([skillType, config]) => (
                <div key={skillType} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addSpecificExperience(skillType as SkillType, 10)}
                      disabled={loading}
                    >
                      +10
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addSpecificExperience(skillType as SkillType, 25)}
                      disabled={loading}
                    >
                      +25
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addSpecificExperience(skillType as SkillType, 50)}
                      disabled={loading}
                    >
                      +50
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能雷达图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillRadarChart userId={currentUserId} size="large" showDetails={true} />
        <SkillDetails userId={currentUserId} />
      </div>
    </div>
  );
};

export default TestSkillRadar;
