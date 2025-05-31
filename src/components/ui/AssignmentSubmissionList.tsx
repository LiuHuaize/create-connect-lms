import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Search,
  Bot,
  ArrowUpDown,
  User
} from 'lucide-react';
import { AssignmentSubmission, StudentAssignmentStatus } from '@/types/course';

// 获取状态显示组件
const getStatusBadge = (status: StudentAssignmentStatus) => {
  switch (status) {
    case 'not_started':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle size={12} className="mr-1 text-gray-500" />
          未开始
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={12} className="mr-1" />
          进行中
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <HelpCircle size={12} className="mr-1" />
          待评分
        </span>
      );
    case 'ai_graded':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Bot size={12} className="mr-1" />
          AI已评分
        </span>
      );
    case 'teacher_graded':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          已评分
        </span>
      );
    default:
      return null;
  }
};

interface AssignmentSubmissionListProps {
  submissions: AssignmentSubmission[];
  onSelectSubmission: (submission: AssignmentSubmission) => void;
  selectedSubmissionId?: string;
  onRequestBatchAIGrading?: () => void;
}

const AssignmentSubmissionList: React.FC<AssignmentSubmissionListProps> = ({
  submissions,
  onSelectSubmission,
  selectedSubmissionId,
  onRequestBatchAIGrading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'submittedAt' | 'aiScore' | 'teacherScore'>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // 过滤和排序提交
  const filteredAndSortedSubmissions = [...submissions]
    .filter(submission => 
      submission.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (submission.profiles?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === 'submittedAt') {
        return sortDirection === 'asc' 
          ? new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
          : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (sortField === 'aiScore') {
        const scoreA = a.aiGrading?.score || 0;
        const scoreB = b.aiGrading?.score || 0;
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      } else if (sortField === 'teacherScore') {
        const scoreA = a.teacherGrading?.score || 0;
        const scoreB = b.teacherGrading?.score || 0;
        return sortDirection === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      return 0;
    });
  
  // 处理排序切换
  const toggleSort = (field: 'submittedAt' | 'aiScore' | 'teacherScore') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // 计算统计信息
  const totalSubmissions = submissions.length;
  const teacherGradedCount = submissions.filter(s => s.teacherGrading).length;
  const aiGradedCount = submissions.filter(s => s.aiGrading && !s.teacherGrading).length;
  const pendingCount = submissions.filter(s => !s.aiGrading && !s.teacherGrading).length;
  
  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="border rounded-md p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">总提交数</p>
          <p className="text-lg font-bold">{totalSubmissions}</p>
        </div>
        <div className="border rounded-md p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">教师已评分</p>
          <p className="text-lg font-bold text-green-600">{teacherGradedCount}</p>
        </div>
        <div className="border rounded-md p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">AI已评分</p>
          <p className="text-lg font-bold text-purple-600">{aiGradedCount}</p>
        </div>
        <div className="border rounded-md p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">待评分</p>
          <p className="text-lg font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>
      
      {/* 搜索和批量操作 */}
      <div className="flex justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索学生姓名..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {onRequestBatchAIGrading && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRequestBatchAIGrading}
            disabled={pendingCount === 0}
          >
            <Bot size={16} className="mr-2" />
            批量AI评分 ({pendingCount})
          </Button>
        )}
      </div>
      
      {/* 提交列表 */}
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                学生
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('submittedAt')}
              >
                <div className="flex items-center">
                  提交时间
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('aiScore')}
              >
                <div className="flex items-center">
                  AI评分
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('teacherScore')}
              >
                <div className="flex items-center">
                  教师评分
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedSubmissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  没有找到匹配的提交
                </td>
              </tr>
            ) : (
              filteredAndSortedSubmissions.map((submission) => (
                <tr 
                  key={submission.id} 
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedSubmissionId === submission.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectSubmission(submission)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={14} className="text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.profiles?.username || submission.studentId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {submission.studentId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.aiGrading ? (
                      <div className="text-sm font-medium">
                        {submission.aiGrading.score}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.teacherGrading ? (
                      <div className="text-sm font-medium">
                        {submission.teacherGrading.score}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.teacherGrading 
                      ? getStatusBadge('teacher_graded')
                      : submission.aiGrading
                        ? getStatusBadge('ai_graded')
                        : getStatusBadge('submitted')
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentSubmissionList; 