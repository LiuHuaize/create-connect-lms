
import React, { useState, useEffect } from 'react';
import { getPublicCourses, getUserCourses } from '@/services/courseService';
import { DbCourse } from '@/types/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus } from 'lucide-react';
import CourseList from '@/components/course/CourseList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const CourseListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<DbCourse[]>([]);
  const [myCourses, setMyCourses] = useState<DbCourse[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState<boolean>(true);
  const [isLoadingMy, setIsLoadingMy] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    const loadCourses = async () => {
      // Load public courses
      setIsLoadingPublic(true);
      try {
        const courses = await getPublicCourses();
        if (courses) {
          setAllCourses(courses);
        }
      } catch (error) {
        console.error('Error loading public courses:', error);
      } finally {
        setIsLoadingPublic(false);
      }
      
      // Load user's courses if logged in
      if (user) {
        setIsLoadingMy(true);
        try {
          const courses = await getUserCourses();
          if (courses) {
            setMyCourses(courses);
          }
        } catch (error) {
          console.error('Error loading user courses:', error);
        } finally {
          setIsLoadingMy(false);
        }
      } else {
        setIsLoadingMy(false);
      }
    };
    
    loadCourses();
  }, [user]);
  
  // Filter courses based on search term
  const filteredAllCourses = allCourses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredMyCourses = myCourses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const createNewCourse = () => {
    navigate('/course-creator');
  };
  
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程中心</h1>
          <p className="text-gray-500">探索和学习各种课程</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="搜索课程..." 
              className="pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {user && (
            <Button className="bg-connect-blue hover:bg-blue-600" onClick={createNewCourse}>
              <Plus size={16} className="mr-2" /> 创建课程
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue={user ? "all" : "all"} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">全部课程</TabsTrigger>
          {user && <TabsTrigger value="my">我的课程</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="all">
          <CourseList 
            courses={filteredAllCourses} 
            isLoading={isLoadingPublic}
            emptyMessage="暂无公开课程"
          />
        </TabsContent>
        
        {user && (
          <TabsContent value="my">
            <CourseList 
              courses={filteredMyCourses} 
              isLoading={isLoadingMy}
              emptyMessage="您尚未创建或参与任何课程"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CourseListPage;
