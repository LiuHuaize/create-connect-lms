import React from 'react';
import SeriesQuestionnaireStudent from '@/components/course/lessons/series-questionnaire/SeriesQuestionnaireStudent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SeriesQuestionnaireTest: React.FC = () => {
  // 使用真实的系列问答ID进行测试
  const testQuestionnaireId = '398393d8-4914-4d95-8720-528fe54cd7dc';
  const testLessonId = '398393d8-4914-4d95-8720-528fe54cd7dc';
  const testCourseId = 'test-course-id';
  const testEnrollmentId = 'test-enrollment-id';

  const handleComplete = () => {
    console.log('系列问答完成');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>系列问答学生端测试</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            这是系列问答学生端组件的测试页面。使用问答ID: {testQuestionnaireId}
          </p>
        </CardContent>
      </Card>

      <SeriesQuestionnaireStudent
        questionnaireId={testQuestionnaireId}
        lessonId={testLessonId}
        courseId={testCourseId}
        enrollmentId={testEnrollmentId}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default SeriesQuestionnaireTest;
