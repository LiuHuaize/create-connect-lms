import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  RefreshCw,
  Award,
  Zap
} from 'lucide-react';
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';
import { toast } from 'sonner';

interface AIGradingWaitPageProps {}

const AIGradingWaitPage: React.FC<AIGradingWaitPageProps> = () => {
  const { courseId, lessonId, questionnaireId } = useParams<{
    courseId: string;
    lessonId: string;
    questionnaireId: string;
  }>();
  const navigate = useNavigate();
  
  // 状态管理
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // AI评分步骤
  const gradingSteps = [
    { 
      id: 0, 
      title: '正在分析您的答案', 
      description: 'AI正在仔细阅读和理解您的回答内容',
      icon: Brain,
      duration: 3000
    },
    { 
      id: 1, 
      title: '评估答案质量', 
      description: '根据评分标准对答案进行全面评估',
      icon: Sparkles,
      duration: 4000
    },
    { 
      id: 2, 
      title: '生成详细反馈', 
      description: '为您准备个性化的学习建议和改进方向',
      icon: Zap,
      duration: 3000
    },
    { 
      id: 3, 
      title: '完成评分', 
      description: '评分已完成，正在为您展示结果',
      icon: Award,
      duration: 1000
    }
  ];

  // 计时器效果
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 模拟进度更新
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsCompleted(true);
          return 100;
        }
        return prev + Math.random() * 3 + 1; // 随机增加1-4%
      });
    }, 200);

    return () => clearInterval(progressTimer);
  }, []);

  // 步骤切换效果
  useEffect(() => {
    if (currentStep < gradingSteps.length - 1) {
      const stepTimer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, gradingSteps[currentStep].duration);

      return () => clearTimeout(stepTimer);
    }
  }, [currentStep, gradingSteps]);

  // 触发AI评分和定期检查评分状态
  useEffect(() => {
    const triggerAIGradingAndCheck = async () => {
      if (!questionnaireId || checkingStatus) return;

      try {
        setCheckingStatus(true);

        // 首先获取提交状态
        const statusResponse = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);

        if (statusResponse.success && statusResponse.data?.submission) {
          const submission = statusResponse.data.submission;

          // 如果已经评分完成，直接跳转
          if (submission.status === 'graded') {
            setIsCompleted(true);
            setTimeout(() => {
              navigate(`/course/${courseId}/lesson/${lessonId}`, {
                replace: true,
                state: { showGradingResult: true }
              });
            }, 2000);
            return;
          }

          // 如果是已提交状态，触发AI评分
          if (submission.status === 'submitted') {
            try {
              console.log('触发AI评分:', submission.id);
              const gradingResponse = await seriesQuestionnaireService.triggerAIGrading({
                submission_id: submission.id,
                force_regrade: false
              });

              if (gradingResponse.success) {
                console.log('AI评分已触发');
                // 评分完成后立即检查状态
                setTimeout(async () => {
                  const updatedStatus = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);
                  if (updatedStatus.success && updatedStatus.data?.submission?.status === 'graded') {
                    setIsCompleted(true);
                    setTimeout(() => {
                      navigate(`/course/${courseId}/lesson/${lessonId}`, {
                        replace: true,
                        state: { showGradingResult: true }
                      });
                    }, 2000);
                  }
                }, 3000);
              }
            } catch (gradingError) {
              console.error('触发AI评分失败:', gradingError);
              toast.error('AI评分启动失败，请稍后重试');
            }
          }
        }
      } catch (error) {
        console.error('检查评分状态失败:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    const checkGradingStatus = async () => {
      if (!questionnaireId || checkingStatus) return;

      try {
        setCheckingStatus(true);
        const response = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);

        if (response.success && response.data?.submission?.status === 'graded') {
          // 评分完成，跳转到结果页面
          setIsCompleted(true);
          setTimeout(() => {
            navigate(`/course/${courseId}/lesson/${lessonId}`, {
              replace: true,
              state: { showGradingResult: true }
            });
          }, 2000);
        }
      } catch (error) {
        console.error('检查评分状态失败:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // 立即触发AI评分和检查
    triggerAIGradingAndCheck();

    // 每5秒检查一次状态
    const statusCheckInterval = setInterval(checkGradingStatus, 5000);

    return () => clearInterval(statusCheckInterval);
  }, [questionnaireId, courseId, lessonId, navigate, checkingStatus]);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 返回课程页面
  const handleGoBack = () => {
    navigate(`/course/${courseId}/lesson/${lessonId}`, { replace: true });
  };

  // 手动刷新状态
  const handleRefreshStatus = async () => {
    if (!questionnaireId) return;
    
    try {
      setCheckingStatus(true);
      const response = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);
      
      if (response.success && response.data?.submission?.status === 'graded') {
        setIsCompleted(true);
        toast.success('评分已完成！');
        setTimeout(() => {
          navigate(`/course/${courseId}/lesson/${lessonId}`, { 
            replace: true,
            state: { showGradingResult: true }
          });
        }, 1000);
      } else {
        toast.info('评分仍在进行中，请稍候...');
      }
    } catch (error) {
      console.error('刷新状态失败:', error);
      toast.error('刷新失败，请稍后重试');
    } finally {
      setCheckingStatus(false);
    }
  };

  const currentStepData = gradingSteps[currentStep];
  const CurrentStepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 主卡片 */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* 旋转的外圈 */}
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                {/* 内部图标 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <CurrentStepIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              AI 智能评分中
            </CardTitle>
            
            <p className="text-gray-600 text-lg">
              请稍候，我们正在为您的答案进行专业评分
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 当前步骤显示 */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <CurrentStepIcon className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentStepData.title}
                </h3>
              </div>
              
              <p className="text-gray-600 max-w-md mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* 进度条 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">评分进度</span>
                <span className="font-medium text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-gray-100"
              />
            </div>

            {/* 步骤指示器 */}
            <div className="flex justify-center space-x-4">
              {gradingSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 transition-all duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors duration-300 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      步骤 {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 时间和状态信息 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">已用时间</span>
                </div>
                <span className="font-mono font-medium text-gray-800">
                  {formatTime(timeElapsed)}
                </span>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  AI评分通常需要1-3分钟，请耐心等待
                </p>
                
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshStatus}
                    disabled={checkingStatus}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                    <span>刷新状态</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>返回课程</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 完成状态 */}
            {isCompleted && (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">评分完成！</span>
                </div>
                <p className="text-gray-600">
                  正在为您跳转到结果页面...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIGradingWaitPage;
