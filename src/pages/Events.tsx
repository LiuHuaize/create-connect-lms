
import React from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Events = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-sm">
            <Filter size={16} className="mr-2" /> Filter
          </Button>
          <Button variant="default" size="sm" className="bg-connect-blue hover:bg-blue-600 text-sm">
            <Calendar size={16} className="mr-2" /> Add to Calendar
          </Button>
        </div>
      </div>
      
      {/* Month navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">February 2024</h2>
          <button className="p-1 rounded-full hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Workshop</Badge>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Webinar</Badge>
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Conference</Badge>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Upcoming event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-connect-blue text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">15</span>
              <span className="text-sm">FEB</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-green-100 text-green-700 mb-2">Workshop</Badge>
                  <h3 className="text-xl font-bold mb-2">Business Model Canvas Workshop</h3>
                  <p className="text-gray-600 mb-4">Learn how to create a comprehensive business model canvas to visualize your business strategy.</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">Feb 15, 2024 • 10:00 AM - 12:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">Register</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-connect-purple text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">22</span>
              <span className="text-sm">FEB</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-blue-100 text-blue-700 mb-2">Webinar</Badge>
                  <h3 className="text-xl font-bold mb-2">Game Design: From Concept to Prototype</h3>
                  <p className="text-gray-600 mb-4">Join industry experts to learn the process of taking a game idea from concept to playable prototype.</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">Feb 22, 2024 • 3:00 PM - 4:30 PM</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">Register</Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Third event */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover-scale">
          <div className="flex">
            <div className="w-24 bg-gray-900 text-white flex flex-col items-center justify-center p-4">
              <span className="text-3xl font-bold">28</span>
              <span className="text-sm">FEB</span>
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-purple-100 text-purple-700 mb-2">Conference</Badge>
                  <h3 className="text-xl font-bold mb-2">Entrepreneurship Summit 2024</h3>
                  <p className="text-gray-600 mb-4">A virtual conference featuring successful entrepreneurs sharing insights on business growth strategies.</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">Feb 28, 2024 • 9:00 AM - 5:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-connect-blue hover:bg-blue-600">Register</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <Button variant="outline" className="text-sm">
          Load More Events
        </Button>
      </div>
    </div>
  );
};

export default Events;
