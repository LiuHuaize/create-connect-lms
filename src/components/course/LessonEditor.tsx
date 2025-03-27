import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { 
  FileText, Video, FileQuestion, 
  Plus, Trash2, AlertCircle
} from 'lucide-react';
import { 
  Lesson, 
  QuizQuestion, 
  QuizQuestionType,
  VideoLessonContent,
  TextLessonContent,
  QuizLessonContent,
  AssignmentLessonContent,
  LessonContent
} from '@/types/course';
import YooptaEditor from '@/components/editor/YooptaEditor';
import YooptaViewer from '@/components/editor/YooptaViewer';

// Quiz question types
const QUESTION_TYPES: { id: QuizQuestionType, name: string }[] = [
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'true_false', name: 'True/False' },
  { id: 'short_answer', name: 'Short Answer' }
];

interface LessonEditorProps {
  lesson: Lesson;
  onSave: (updatedLesson: Lesson | null) => void;
}

const LessonEditor = ({ lesson, onSave }: LessonEditorProps) => {
  // Initialize content with the correct structure based on lesson type
  const initializeContent = (): LessonContent => {
    const baseContent = lesson.content;
    
    switch (lesson.type) {
      case 'video':
        return { 
          videoUrl: (baseContent as VideoLessonContent).videoUrl || '', 
          description: (baseContent as VideoLessonContent).description || '' 
        } as VideoLessonContent;
      case 'text':
        return { 
          text: (baseContent as TextLessonContent).text || '' 
        } as TextLessonContent;
      case 'quiz':
        return { 
          questions: (baseContent as QuizLessonContent).questions || [] 
        } as QuizLessonContent;
      case 'assignment':
        return { 
          instructions: (baseContent as AssignmentLessonContent).instructions || '', 
          criteria: (baseContent as AssignmentLessonContent).criteria || '' 
        } as AssignmentLessonContent;
      default:
        return baseContent;
    }
  };
  
  const [currentContent, setCurrentContent] = useState<LessonContent>(initializeContent());
  
  // Form setup for lesson details
  const form = useForm({
    defaultValues: {
      title: lesson.title || '',
      ...currentContent
    }
  });
  
  const handleSubmit = (data) => {
    const updatedLesson: Lesson = {
      ...lesson,
      title: data.title,
      content: { ...currentContent }
    };
    
    // Depending on the lesson type, extract the relevant content fields
    if (lesson.type === 'video') {
      updatedLesson.content = { 
        videoUrl: data.videoUrl,
        description: data.description
      } as VideoLessonContent;
    } else if (lesson.type === 'text') {
      updatedLesson.content = { 
        text: data.text 
      } as TextLessonContent;
    } else if (lesson.type === 'quiz') {
      // Quiz questions are handled separately through the questions state
      updatedLesson.content = { 
        questions: questions 
      } as QuizLessonContent;
    } else if (lesson.type === 'assignment') {
      updatedLesson.content = { 
        instructions: data.instructions,
        criteria: data.criteria 
      } as AssignmentLessonContent;
    }
    
    onSave(updatedLesson);
  };
  
  // Quiz specific state and handlers
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    lesson.type === 'quiz' 
      ? (currentContent as QuizLessonContent).questions || [
          {
            id: 'q1',
            type: 'multiple_choice',
            text: 'What is the primary purpose of a business plan?',
            options: [
              { id: 'o1', text: 'To secure funding' },
              { id: 'o2', text: 'To guide business operations' },
              { id: 'o3', text: 'To analyze the market' }
            ],
            correctOption: 'o2'
          }
        ]
      : []
  );
  
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      type: 'multiple_choice',
      text: 'New Question',
      options: [
        { id: `o${Date.now()}-1`, text: 'Option 1' },
        { id: `o${Date.now()}-2`, text: 'Option 2' }
      ],
      correctOption: ''
    };
    
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const updateQuestion = (questionId: string, field: string, value: any) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const updateOption = (questionId: string, optionId: string, value: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map(opt => 
              opt.id === optionId ? { ...opt, text: value } : opt
            ) 
          } 
        : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    
    if (question && question.options) {
      const newOption = {
        id: `o${Date.now()}`,
        text: `Option ${question.options.length + 1}`
      };
      
      const updatedQuestions = questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), newOption] } 
          : q
      );
      
      setQuestions(updatedQuestions);
      setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
    }
  };
  
  const deleteOption = (questionId: string, optionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.filter(opt => opt.id !== optionId),
            correctOption: q.correctOption === optionId ? '' : q.correctOption
          } 
        : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };
  
  const setCorrectOption = (questionId: string, optionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, correctOption: optionId } : q
    );
    
    setQuestions(updatedQuestions);
    setCurrentContent({ ...currentContent, questions: updatedQuestions } as QuizLessonContent);
  };

  // Handle text content change through Yoopta Editor
  const handleTextContentChange = (value: string) => {
    form.setValue('text', value);
    setCurrentContent({ ...currentContent, text: value } as TextLessonContent);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lesson Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for this lesson" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        {/* Render different content fields based on lesson type */}
        {lesson.type === 'video' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter the URL of the video (YouTube, Vimeo, etc.)" 
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e);
                        setCurrentContent({...currentContent, videoUrl: e.target.value} as VideoLessonContent);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste a YouTube, Vimeo, or other video platform URL
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Description</FormLabel>
                  <FormControl>
                    <YooptaEditor
                      initialValue={field.value || ''}
                      onChange={(value) => {
                        field.onChange(value);
                        setCurrentContent({...currentContent, description: value} as VideoLessonContent);
                      }}
                      placeholder="Enter a description for this video"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4 text-gray-700">
                <Video size={18} className="mr-2 text-blue-600" />
                <span className="font-medium">Video Preview</span>
              </div>
              
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                {(currentContent as VideoLessonContent).videoUrl ? (
                  <iframe 
                    src={(currentContent as VideoLessonContent).videoUrl.replace('watch?v=', 'embed/')} 
                    className="w-full h-full rounded-lg" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center text-gray-400">
                    <AlertCircle size={24} className="mr-2" />
                    <span>Enter a video URL to see preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {lesson.type === 'text' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <YooptaEditor
                      initialValue={field.value || ''}
                      onChange={handleTextContentChange}
                      placeholder="Enter your lesson content here"
                    />
                  </FormControl>
                  <FormDescription>
                    Use the toolbar above to format your content with headings, lists, images, and more
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4 text-gray-700">
                <FileText size={18} className="mr-2 text-green-600" />
                <span className="font-medium">Content Preview</span>
              </div>
              
              <div className="prose max-w-none p-4 bg-white rounded-lg border border-gray-100">
                {lesson.type === 'text' && (currentContent as TextLessonContent).text ? (
                  <YooptaViewer content={(currentContent as TextLessonContent).text} />
                ) : (
                  <div className="text-gray-400 italic">
                    Preview will appear here as you type content
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {lesson.type === 'quiz' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Quiz Questions</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addQuestion}
              >
                <Plus size={14} className="mr-2" /> Add Question
              </Button>
            </div>
            
            {questions.map((question, index) => (
              <div 
                key={question.id} 
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300"
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </label>
                    <Input 
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                    />
                  </div>
                  
                  {question.type === 'multiple_choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Answer Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map(option => (
                          <div key={option.id} className="flex items-center">
                            <input
                              type="radio"
                              className="mr-2"
                              checked={question.correctOption === option.id}
                              onChange={() => setCorrectOption(question.id, option.id)}
                            />
                            <Input
                              className="flex-1"
                              value={option.text}
                              onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                            />
                            <button
                              type="button"
                              className="ml-2 text-gray-500 hover:text-red-500"
                              onClick={() => deleteOption(question.id, option.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus size={14} className="mr-2" /> Add Option
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select the radio button next to the correct answer
                      </p>
                    </div>
                  )}
                  
                  {question.type === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`tf-${question.id}`}
                            className="mr-2"
                            checked={question.correctOption === 'true'}
                            onChange={() => setCorrectOption(question.id, 'true')}
                          />
                          <span>True</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`tf-${question.id}`}
                            className="mr-2"
                            checked={question.correctOption === 'false'}
                            onChange={() => setCorrectOption(question.id, 'false')}
                          />
                          <span>False</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'short_answer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Answer (for reference)
                      </label>
                      <Textarea
                        className="min-h-24"
                        value={question.sampleAnswer || ''}
                        onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                        placeholder="Enter a sample answer for reference"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {lesson.type === 'assignment' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Instructions</FormLabel>
                  <FormControl>
                    <YooptaEditor
                      initialValue={field.value || ''}
                      onChange={(value) => {
                        field.onChange(value);
                        setCurrentContent({...currentContent, instructions: value} as AssignmentLessonContent);
                      }}
                      placeholder="Enter detailed instructions for the assignment"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="criteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Criteria</FormLabel>
                  <FormControl>
                    <YooptaEditor
                      initialValue={field.value || ''}
                      onChange={(value) => {
                        field.onChange(value);
                        setCurrentContent({...currentContent, criteria: value} as AssignmentLessonContent);
                      }}
                      placeholder="Enter the criteria that will be used to evaluate this assignment"
                    />
                  </FormControl>
                  <FormDescription>
                    Describe how this assignment will be evaluated
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => onSave(null)}>
            Cancel
          </Button>
          <Button type="submit">Save Lesson</Button>
        </div>
      </form>
    </Form>
  );
};

export default LessonEditor;
