
import React from 'react';
import { ChevronDown } from 'lucide-react';
import CourseCard from '@/components/ui/CourseCard';
import FeatureCard from '@/components/ui/FeatureCard';
import { MessageSquare, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Recommended for you</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
              <span>Related topics:</span>
              <button className="text-connect-blue hover:underline">Business Planning</button>
              <span>|</span>
              <button className="text-connect-blue hover:underline">Game Design</button>
              <span>|</span>
              <button className="text-connect-blue hover:underline">Product Development</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <CourseCard
          type="skill"
          title="Business Plan Development"
          description="Learn how to create comprehensive business plans. Understand market research, financial projections, and strategic planning."
          coursesCount={7}
          certificate={true}
          level="Intermediate"
          hours={22}
        />
        
        <CourseCard
          type="free"
          title="Card Game Design Fundamentals"
          description="Explore the basics of card game design. Learn mechanics, balancing strategies, and prototyping techniques for engaging games."
          level="Intermediate"
          hours={1}
        />
        
        <CourseCard
          type="career"
          title="Project Management Professional"
          description="Build end-to-end project management skills. Master planning, execution, monitoring, and team leadership for successful projects."
          coursesCount={7}
          certificate={true}
          level="Intermediate"
          hours={50}
        />
      </div>
      
      <div className="flex justify-center mb-12">
        <button className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          View more <ChevronDown size={16} />
        </button>
      </div>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Discover more features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            icon={<MessageSquare size={24} className="text-connect-blue" />}
            title="Interactive workshops"
            description="Practice your skills with real-time feedback and guidance from industry experts."
          />
          
          <FeatureCard
            icon={<CheckCircle size={24} className="text-connect-blue" />}
            title="Project readiness checker"
            description="Analyze your project plans and get recommendations to improve your strategy and execution."
          />
        </div>
      </section>
      
      <section>
        <div className="bg-connect-cream rounded-2xl p-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-4">Try Plus or Pro with a 7-day free trial</h2>
            <p className="text-gray-700 mb-6">Go deeper and learn practical skills. Work on real-world projects, receive feedback, and earn certificates.</p>
            
            <button className="bg-black hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-medium transition-colors">
              Try for free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
