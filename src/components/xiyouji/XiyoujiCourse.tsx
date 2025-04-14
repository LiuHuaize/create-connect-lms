import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CharacterCard from './CharacterCard';
import AIChatBox, { ChatMessage } from './AIChatBox';
import CharacterStoryWithStyle from './CharacterStory';

interface XiyoujiCourseProps {
  onBack: () => void;
}

// 人物数据
const characters = [
  {
    id: 'tangseng',
    name: '唐僧',
    avatar: '/images/唐僧.png',
    strengths: ['善良', '坚持', '忠诚', '有信仰'],
    weaknesses: ['轻信他人', '缺乏判断力', '体弱多病', '缺乏自保能力'],
    stories: [
      {
        title: '三打白骨精',
        content: '唐僧看到白骨精变成的女子主动投怀送抱，哪怕孙悟空说破白骨精的真面目，他依然相信自己眼前所见，甚至为此逐出孙悟空。这个故事展示了唐僧轻信他人、缺乏判断力的特点，也显示了他对佛法的忠诚和坚持。',
      },
      {
        title: '收服八戒',
        content: '唐僧通过劝说和佛法感化高老庄的猪八戒，让他皈依佛门，做了自己的二徒弟。这个故事展示了唐僧善良、有信仰、以德服人的特点。',
      }
    ],
    needs: ['安全保障系统', '辨别真伪的AI助手', '身体健康管理APP', '准确的导航系统']
  },
  {
    id: 'wukong',
    name: '孙悟空',
    avatar: '/images/孙悟空.jpeg',
    strengths: ['战斗力强', '神通广大', '机智聪明', '忠心护主'],
    weaknesses: ['暴躁易怒', '傲慢自大', '叛逆', '缺乏耐心'],
    stories: [
      {
        title: '大闹天宫',
        content: '孙悟空因不满自己"弼马温"的职位，大闹天宫，自封为"齐天大圣"。这个故事展示了他叛逆、傲慢、不服管教的性格，同时也显示了他勇敢无惧、追求自由的一面。',
      },
      {
        title: '火眼金睛',
        content: '孙悟空用火眼金睛识破妖怪的伪装，保护师父的安全，如三打白骨精的故事。这展示了他的忠心护主、机智聪明，以及超凡的能力。',
      }
    ],
    needs: ['情绪管理工具', '沟通技巧提升APP', '团队协作系统', '战斗力量监测器']
  },
  {
    id: 'bajie',
    name: '猪八戒',
    avatar: '/images/猪八戒.jpeg',
    strengths: ['力气大', '老实', '会水性', '有生活情趣'],
    weaknesses: ['贪吃', '好色', '懒惰', '胆小'],
    stories: [
      {
        title: '高老庄娶亲',
        content: '猪八戒变成女婿在高老庄生活，贪图安逸，不愿离开。这展示了他贪图享乐、懒惰的一面，但也说明他重视生活品质。',
      },
      {
        title: '偷人参果',
        content: '在人参果园里，猪八戒经不起美食的诱惑，偷吃人参果导致麻烦。这个故事生动地展示了他贪吃、缺乏自制力的特点。',
      }
    ],
    needs: ['饮食管理系统', '意志力训练app', '体能提升工具', '任务提醒器']
  },
  {
    id: 'wujing',
    name: '沙僧',
    avatar: '/images/沙僧.jpeg',
    strengths: ['忠诚', '踏实', '有耐心', '做事稳重'],
    weaknesses: ['存在感低', '个性不突出', '缺乏特殊能力', '沟通技巧欠缺'],
    stories: [
      {
        title: '流沙河收服',
        content: '沙僧在流沙河吃唐僧肉的传言，实际上是在等待取经人过河，渴望被救赎。这个故事表明他虽有过错，但内心向善，渴望改变。',
      },
      {
        title: '挑担行李',
        content: '沙僧一路上默默无闻地挑担行李，尽职尽责地完成自己的任务。这反映了他踏实、负责、甘于奉献的特点。',
      }
    ],
    needs: ['个人形象提升系统', '特殊技能培训程序', '团队定位系统', '沟通辅助工具']
  }
];

const XiyoujiCourse: React.FC<XiyoujiCourseProps> = ({ onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: `你好！我是你的AI助手，可以帮你思考${selectedCharacter.name}的需求。告诉我你的想法吧！` }
  ]);
  const [showNeeds, setShowNeeds] = useState(false);
  const [characterNeeds, setCharacterNeeds] = useState<string[]>([]);
  
  // 选择角色时的处理函数
  const handleSelectCharacter = (character: typeof characters[0]) => {
    setSelectedCharacter(character);
    // 重置需求显示
    setShowNeeds(false);
    setCharacterNeeds([]);
    // 重置聊天消息
    setChatMessages([
      { role: 'ai', content: `你好！我是你的AI助手，可以帮你思考${character.name}的需求。告诉我你的想法吧！` }
    ]);
  };
  
  // 处理聊天消息发送
  const handleSendMessage = (message: string) => {
    // 添加用户消息
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // 模拟AI回复
    setTimeout(() => {
      let aiResponse = '';
      
      // 简单的关键词匹配，实际应用中可以集成更复杂的AI
      if (message.includes('需求') || message.includes('功能')) {
        aiResponse = `根据${selectedCharacter.name}的性格特点，我认为他需要的软件功能可能包括：
1. ${selectedCharacter.needs[0]}
2. ${selectedCharacter.needs[1]}
3. ${selectedCharacter.needs[2]}

你觉得还有什么其他功能可以帮助他吗？`;
        // 显示需求列表
        setShowNeeds(true);
        setCharacterNeeds(selectedCharacter.needs);
      } else if (message.includes('弱点') || message.includes('缺点')) {
        aiResponse = `${selectedCharacter.name}的主要弱点包括：${selectedCharacter.weaknesses.join('、')}。我们可以设计软件来弥补这些不足，你有什么想法吗？`;
      } else if (message.includes('优点') || message.includes('长处')) {
        aiResponse = `${selectedCharacter.name}的优势包括：${selectedCharacter.strengths.join('、')}。我们可以基于这些优势设计更适合的功能，你觉得可以如何利用这些优势呢？`;
      } else {
        aiResponse = `你提到了关于${selectedCharacter.name}的看法，很有趣！基于他的性格特点，你认为什么样的软件功能可以帮助他解决西天取经路上的问题呢？`;
      }
      
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors text-sm md:text-base"
        >
          <ArrowLeft size={18} className="mr-1.5" />
          <span>返回课程列表</span>
        </button>
        
        <div className="px-3 py-1 bg-indigo-100/80 text-indigo-600 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm">
          模块 1/4: 人物分析
        </div>
      </div>
      
      {/* 课程标题 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-2">
          西游记PBL项目课程
        </h1>
        <p className="text-indigo-500 text-sm md:text-base">假如你穿越到古代，成为师徒四人的技术负责人</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
        {/* 人物选择卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100/80 p-4 h-min backdrop-blur-sm bg-white/90">
          <h2 className="text-base md:text-lg font-medium text-indigo-700 mb-3 flex items-center">
            <Info size={16} className="mr-1.5 text-indigo-400" />
            选择人物
          </h2>
          
          <div className="grid grid-cols-2 gap-2.5">
            {characters.map(character => (
              <CharacterCard
                key={character.id}
                avatar={character.avatar}
                name={character.name}
                strengths={character.strengths}
                weaknesses={character.weaknesses}
                isSelected={selectedCharacter.id === character.id}
                onClick={() => handleSelectCharacter(character)}
              />
            ))}
          </div>
        </div>
        
        {/* 人物详情卡片 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-indigo-100/80 lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="w-full grid grid-cols-3 bg-indigo-50/70">
                <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-sm py-2.5">
                  人物特点
                </TabsTrigger>
                <TabsTrigger value="stories" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-sm py-2.5">
                  相关故事
                </TabsTrigger>
                <TabsTrigger value="ai-chat" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-sm py-2.5">
                  AI 思考助手
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* 人物特点标签内容 */}
            <TabsContent value="analysis" className="p-4 pt-5">
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedCharacter.strengths.map((strength, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs md:text-sm font-medium animate-fadeIn border border-green-100"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    + {strength}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedCharacter.weaknesses.map((weakness, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs md:text-sm font-medium animate-fadeIn border border-amber-100"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    - {weakness}
                  </span>
                ))}
              </div>
              
              {showNeeds && (
                <div className="mb-5 animate-fadeSlideUp">
                  <h3 className="text-sm md:text-base font-medium text-indigo-700 mb-3 flex items-center">
                    <Sparkles size={16} className="mr-1.5 text-amber-400" />
                    可能的需求
                  </h3>
                  <div className="space-y-2.5">
                    {characterNeeds.map((need, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-purple-50 text-purple-600 rounded-lg text-xs md:text-sm animate-fadeSlideUp border border-purple-100"
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        {need}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 rounded-lg text-xs md:text-sm text-blue-600 border border-blue-100">
                <p>👉 思考: 分析{selectedCharacter.name}的特点，你觉得他在西天取经路上最需要什么样的帮助？</p>
              </div>
            </TabsContent>
            
            {/* 相关故事标签内容 */}
            <TabsContent value="stories" className="p-4 pt-5 max-h-[600px] overflow-y-auto">
              <CharacterStoryWithStyle 
                stories={selectedCharacter.stories}
                characterName={selectedCharacter.name}
              />
            </TabsContent>
            
            {/* AI 思考助手标签内容 */}
            <TabsContent value="ai-chat" className="p-0 h-[450px]">
              <AIChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                characterName={selectedCharacter.name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* 下一步按钮 */}
      <div className="mt-8 text-center">
        <Button 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm md:text-base shadow-sm transition-all duration-300"
          disabled
        >
          下一步：产品画布
          <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">即将推出</span>
        </Button>
      </div>
    </div>
  );
};

// 添加自定义动画到全局样式
const GlobalStyle = () => {
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeSlideUp {
        from { 
          opacity: 0;
          transform: translateY(8px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.4s ease-out forwards;
      }
      
      .animate-fadeSlideUp {
        animation: fadeSlideUp 0.4s ease-out forwards;
      }
      
      .text-shadow {
        text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.08);
      }
    `}</style>
  );
};

export default function XiyoujiCourseWithStyle(props: XiyoujiCourseProps) {
  return (
    <>
      <GlobalStyle />
      <XiyoujiCourse {...props} />
    </>
  );
} 