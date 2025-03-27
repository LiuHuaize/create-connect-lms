
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FilePlus, Upload, Trash2, Plus, Pencil, Edit, Save, BookOpen, Video, FileText, Image } from 'lucide-react';

const CourseCreator = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Creator</h1>
          <p className="text-gray-500">Design and publish your own course</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">Preview</Button>
          <Button variant="outline">Save Draft</Button>
          <Button className="bg-connect-blue hover:bg-blue-600">Publish</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                    <Input placeholder="e.g. Comprehensive Business Plan Creation" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <Input placeholder="Brief description (1-2 sentences)" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                    <Textarea placeholder="Detailed description of your course content and goals" className="min-h-32" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
                      <option>Business Planning</option>
                      <option>Game Design</option>
                      <option>Product Development</option>
                      <option>Marketing</option>
                      <option>Project Management</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" />
                        <span>Beginner</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" checked />
                        <span>Intermediate</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="level" className="mr-2" />
                        <span>Advanced</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Course Image</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop an image, or click to browse</p>
                  <p className="text-xs text-gray-400 mb-4">Recommended size: 1280x720px (16:9 ratio)</p>
                  <Button variant="outline" size="sm">
                    <Upload size={16} className="mr-2" /> Upload Image
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Course Structure</h2>
                  <Button size="sm">
                    <Plus size={16} className="mr-2" /> Add Module
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Module */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium">Module 1:</span>
                        <Input 
                          value="Introduction to Business Planning" 
                          className="ml-2 border-0 bg-transparent focus:ring-0" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-500 hover:text-gray-700">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* Lesson item */}
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-md mr-3">
                            <Video size={16} className="text-connect-blue" />
                          </div>
                          <span>Introduction Video</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-500 hover:text-gray-700">
                            <Pencil size={14} />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Lesson item */}
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-50 rounded-md mr-3">
                            <FileText size={16} className="text-green-600" />
                          </div>
                          <span>Business Plan Overview</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-500 hover:text-gray-700">
                            <Pencil size={14} />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus size={14} className="mr-2" /> Add Lesson
                      </Button>
                    </div>
                  </div>
                  
                  {/* Module 2 */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium">Module 2:</span>
                        <Input 
                          value="Market Research and Analysis" 
                          className="ml-2 border-0 bg-transparent focus:ring-0" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-500 hover:text-gray-700">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-gray-500 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus size={14} className="mr-2" /> Add Lesson
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Course Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" checked />
                      <span className="text-sm font-medium">Enable Course Certificate</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students will receive a certificate upon completion</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" checked />
                      <span className="text-sm font-medium">Allow Student Discussions</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students can ask questions and discuss course content</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm font-medium">Require Quiz Completion</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Students must pass quizzes to advance to next module</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Access</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-connect-blue/20 focus:border-connect-blue">
                      <option>Free Access</option>
                      <option>Premium Only</option>
                      <option>Private (Invitation Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-bold mb-1">Course Overview</h3>
              <p className="text-sm text-gray-500">Preview of your course card</p>
            </div>
            
            <div className="p-5">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Image size={32} className="text-gray-400" />
                </div>
                
                <div className="p-4">
                  <div className="bg-connect-lightBlue text-connect-blue inline-block px-2 py-1 rounded-full text-xs font-medium mb-2">
                    Business Planning
                  </div>
                  <h3 className="font-bold mb-2">Your Course Title</h3>
                  <p className="text-sm text-gray-600 mb-4">Your course description will appear here. Make it compelling to attract students.</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <BookOpen size={14} className="mr-1" />
                    <span>0 Modules</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={14} className="mr-1" />
                    <span>0 hours total</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Completion Status</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-connect-blue h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">40% complete - add more content to finish</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Required for Publishing</h4>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Course title
                    </li>
                    <li className="flex items-center text-red-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Course image
                    </li>
                    <li className="flex items-center text-red-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      At least one complete module
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
