import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft,
  Bot,
  ArrowLeft
} from 'lucide-react';
import AssignmentGrading from '@/components/ui/AssignmentGrading';
import AssignmentSubmissionList from '@/components/ui/AssignmentSubmissionList';
import { AssignmentSubmission } from '@/types/course';
import { useToast } from '@/components/ui/use-toast';
import { getSubmissionsByLessonId, getSubmissionsByCourseId, submitTeacherGrading } from '@/services/assignmentService';

// 模拟数据
const dummySubmissions: AssignmentSubmission[] = [
  {
    id: '1',
    studentId: 'zhang_li',
    lessonId: 'lesson1',
    content: `<h1>商业计划书</h1>
      <p>本商业计划书描述了一个创新的在线教育平台，专注于提供编程和数字技能培训。</p>
      <h2>市场分析</h2>
      <p>当前在线教育市场规模达到3000亿美元，预计年增长率为15%。</p>
      <p>我们的目标市场是18-35岁的年轻专业人士，他们希望通过学习编程技能来提升职业发展。</p>`,
    submittedAt: '2023-06-15T10:30:00Z',
    aiGrading: {
      score: 85,
      feedback: `非常好的商业计划书框架，能够清晰地表达业务概念和目标市场。

以下是我的详细反馈：

1. 优点：
   - 清晰定义了目标市场
   - 提供了市场规模和增长预期的具体数据
   - 结构清晰

2. 改进空间：
   - 可以增加竞争对手分析部分
   - 缺少具体的商业模式和收入预测
   - 建议添加团队背景介绍

总体来说，这是一个良好的开端，但需要更多细节来支持其可行性。`,
      timestamp: '2023-06-15T11:45:00Z'
    },
    teacherGrading: {
      score: 82,
      feedback: "商业计划书的结构清晰，但需要更多细节和数据支持。建议增加竞争分析和具体的营销计划。",
      timestamp: '2023-06-16T09:20:00Z'
    }
  },
  {
    id: '2',
    studentId: 'wang_xiaoming',
    lessonId: 'lesson1',
    content: `<h1>创新教育平台商业计划</h1>
      <p>我们提供一个创新的移动学习平台，让学生可以随时随地学习新技能。</p>
      <h2>商业模式</h2>
      <p>采用订阅制模式，月费39元，年费398元。</p>
      <p>提供免费试用课程吸引用户，通过优质内容提高转化率。</p>
      <h2>团队介绍</h2>
      <p>团队成员来自知名互联网公司和教育机构，拥有丰富的行业经验。</p>`,
    submittedAt: '2023-06-15T14:20:00Z',
    aiGrading: {
      score: 92,
      feedback: `这是一份出色的商业计划书，包含了关键的商业要素。

具体反馈：

1. 优势：
   - 明确的商业模式和定价策略
   - 详细的团队背景介绍增加了可信度
   - 清晰的用户获取策略（免费试用转付费）

2. 建议改进：
   - 可以增加市场规模数据
   - 建议添加前12个月的收入预测
   - 考虑增加一个竞争分析部分

总体评价：计划结构完整，包含了商业模式、团队和部分市场策略，是一个相当成熟的计划书框架。`,
      timestamp: '2023-06-15T15:30:00Z'
    }
  },
  {
    id: '3',
    studentId: 'li_jun',
    lessonId: 'lesson1',
    content: `<h1>在线健身教练平台</h1>
      <p>我们的平台连接专业健身教练和需要个性化指导的用户。</p>
      <h2>市场需求</h2>
      <p>疫情后，居家健身需求增长40%，但缺乏专业指导。</p>
      <h2>技术优势</h2>
      <p>使用AI技术分析用户运动姿势，提供实时反馈。</p>
      <p>基于用户数据提供个性化训练计划。</p>`,
    submittedAt: '2023-06-15T16:45:00Z'
  }
];

interface AssignmentSubmissionViewerProps {
  lessonId?: string;
  courseId?: string;
  aiGradingPrompt?: string;
  onBack?: () => void;
  initialSubmission?: AssignmentSubmission;
  onSubmissionUpdated?: (updatedSubmission: AssignmentSubmission) => void;
}

export const AssignmentSubmissionViewer: React.FC<AssignmentSubmissionViewerProps> = ({
  lessonId,
  courseId,
  aiGradingPrompt,
  onBack,
  initialSubmission,
  onSubmissionUpdated
}) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(initialSubmission || null);
  const [isAIGradingLoading, setIsAIGradingLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSubmission);
  
  // 加载提交
  useEffect(() => {
    if (!initialSubmission) {
      loadSubmissions();
    }
  }, [lessonId, courseId, initialSubmission]);
  
  // 加载提交列表
  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      
      let data;
      if (lessonId) {
        // 获取特定课时的提交
        data = await getSubmissionsByLessonId(lessonId);
      } else if (courseId) {
        // 获取整个课程的提交
        data = await getSubmissionsByCourseId(courseId);
      } else {
        toast({
          title: '参数错误',
          description: '必须提供 lessonId 或 courseId',
          variant: 'destructive',
        });
        return;
      }
      
      if (data) {
        // 将API返回数据转换为组件需要的格式
        const formattedSubmissions = data.map((sub: any): AssignmentSubmission => ({
          id: sub.id,
          studentId: sub.student_id,
          lessonId: sub.lesson_id,
          content: sub.content || '',
          submittedAt: sub.submitted_at,
          fileSubmissions: sub.file_submissions || [],
          teacherGrading: sub.teacher_grading,
          aiGrading: sub.ai_grading
        }));
        
        setSubmissions(formattedSubmissions);
      }
    } catch (error) {
      console.error('加载提交列表失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载学生提交列表',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 选择提交
  const handleSelectSubmission = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
  };
  
  // 请求AI评分
  const handleRequestAIGrading = async () => {
    if (!selectedSubmission) return;
    
    setIsAIGradingLoading(true);
    
    try {
      // TODO: 实现实际的AI评分API调用
      // 模拟API请求
      setTimeout(() => {
        // 模拟更新提交的AI评分结果
        const aiGradingResult = {
          score: Math.floor(Math.random() * 20) + 80, // 模拟80-100之间的随机分数
          feedback: `这是AI生成的评语，实际应用中将由真实的AI大模型生成。

评分反馈:
1. 内容完整性: 良好，但缺少一些关键部分
2. 逻辑性: 结构清晰，论述有条理
3. 创新性: 有一定的创新点，但可以进一步发展
4. 表达清晰度: 表述清晰，但部分术语使用不够准确

建议:
- 增加更多市场数据支持你的论点
- 考虑添加财务预测部分
- 进一步阐述你的产品/服务的独特卖点`,
          timestamp: new Date().toISOString()
        };
        
        // 更新选中的提交
        const updatedSubmission = { 
          ...selectedSubmission,
          aiGrading: aiGradingResult
        };
        
        setSelectedSubmission(updatedSubmission);
        setIsAIGradingLoading(false);
        
        // 通知父组件
        if (onSubmissionUpdated) {
          onSubmissionUpdated(updatedSubmission);
        }
        
        toast({
          title: 'AI评分完成',
          description: `AI已为该作业评分: ${aiGradingResult.score}分`,
        });
      }, 2000); // 模拟2秒的API延迟
    } catch (error) {
      console.error('AI评分失败:', error);
      toast({
        title: 'AI评分失败',
        description: '无法完成AI评分，请稍后重试',
        variant: 'destructive',
      });
      setIsAIGradingLoading(false);
    }
  };
  
  // 批量AI评分
  const handleBatchAIGrading = () => {
    // 实际应用中，这里应该调用批量评分API
    toast({
      title: '批量评分已触发',
      description: '系统将自动为所有未评分的作业进行AI评分',
    });
  };
  
  // 提交教师评分
  const handleTeacherGradingSubmit = async (score: number, feedback: string) => {
    if (!selectedSubmission) return;
    
    try {
      const grading = {
        score,
        feedback,
        timestamp: new Date().toISOString()
      };
      
      // 调用API提交评分
      await submitTeacherGrading(selectedSubmission.id, grading);
      
      // 更新本地状态
      const updatedSubmission = { 
        ...selectedSubmission,
        teacherGrading: grading
      };
      
      // 更新选中的提交
      setSelectedSubmission(updatedSubmission);
      
      // 更新提交列表中的该提交
      setSubmissions(prev => 
        prev.map(sub => sub.id === updatedSubmission.id ? updatedSubmission : sub)
      );
      
      // 通知父组件提交已更新
      if (onSubmissionUpdated) {
        onSubmissionUpdated(updatedSubmission);
      }
      
      toast({
        title: '评分成功',
        description: '教师评分已成功保存',
      });
    } catch (error) {
      console.error('提交评分失败:', error);
      toast({
        title: '评分失败',
        description: '保存教师评分时出错，请重试',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 顶部标题和返回按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBack}
              className="mr-2"
            >
              <ArrowLeft size={16} className="mr-1" />
              返回
            </Button>
          )}
          <h2 className="text-lg font-bold">作业提交与评分</h2>
        </div>
        
        <div className="text-sm text-gray-500">
          {lessonId ? `课时ID: ${lessonId}` : courseId ? `课程ID: ${courseId}` : ''}
        </div>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : initialSubmission ? (
        // 单一提交视图
        <div>
          <AssignmentGrading 
            submission={selectedSubmission!}
            aiGradingPrompt={aiGradingPrompt}
            onTeacherGradingSubmit={handleTeacherGradingSubmit}
            onRequestAIGrading={handleRequestAIGrading}
            isAIGradingLoading={isAIGradingLoading}
            onSubmissionUpdated={onSubmissionUpdated}
          />
        </div>
      ) : (
        // 列表和详情视图
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧提交列表 */}
          <div className="lg:col-span-1">
            <h3 className="text-md font-semibold mb-4">学生提交列表</h3>
            <AssignmentSubmissionList 
              submissions={submissions}
              onSelectSubmission={handleSelectSubmission}
              selectedSubmissionId={selectedSubmission?.id}
              onRequestBatchAIGrading={handleBatchAIGrading}
            />
          </div>
          
          {/* 右侧评分界面 */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <AssignmentGrading 
                submission={selectedSubmission}
                aiGradingPrompt={aiGradingPrompt}
                onTeacherGradingSubmit={handleTeacherGradingSubmit}
                onRequestAIGrading={handleRequestAIGrading}
                isAIGradingLoading={isAIGradingLoading}
                onSubmissionUpdated={onSubmissionUpdated}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-300 rounded-lg bg-gray-50 h-full min-h-[400px]">
                <Bot size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">从左侧列表选择一个提交来查看详情</p>
                <p className="text-sm text-gray-500">每个提交可以使用AI自动评分和教师手动评分</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissionViewer; 