#!/usr/bin/env node

/**
 * AI评分服务工作流演示
 * 演示完整的系列问答AI评分流程
 */

console.log('🎓 系列问答AI评分服务演示');
console.log('=====================================\n');

// 模拟系列问答数据
const questionnaireData = {
  id: 'questionnaire-001',
  title: '计算机网络基础评估',
  description: '测试学生对计算机网络基本概念的掌握程度',
  ai_grading_prompt: '请根据学生答案的技术准确性、概念理解深度、逻辑表达能力进行综合评分',
  ai_grading_criteria: '技术准确性(30分)：概念和术语使用是否正确；理解深度(30分)：是否理解核心原理；逻辑表达(25分)：表达是否清晰有条理；完整性(15分)：是否完整回答问题',
  max_score: 100
};

const questions = [
  {
    id: 'q1',
    title: 'OSI七层模型',
    content: '请详细说明OSI七层网络模型的各层功能和作用',
    required: true,
    word_limit: 300
  },
  {
    id: 'q2',
    title: 'TCP与UDP的区别',
    content: '比较TCP和UDP协议的主要区别，并说明各自的应用场景',
    required: true,
    word_limit: 250
  },
  {
    id: 'q3',
    title: 'IP地址分类',
    content: '解释IPv4地址的分类方法和子网掩码的作用',
    required: false,
    word_limit: 200
  }
];

// 模拟三个不同水平的学生提交
const submissions = [
  {
    student_id: 'student-001',
    student_name: '张三',
    answers: [
      {
        question_id: 'q1',
        answer_text: 'OSI七层模型从下到上分别是：物理层(传输比特流)、数据链路层(帧传输和错误检测)、网络层(路由选择和IP寻址)、传输层(端到端通信，TCP/UDP)、会话层(建立和管理会话)、表示层(数据加密和压缩)、应用层(为应用程序提供网络服务)。每层都有特定的功能，上层依赖下层提供的服务。',
        word_count: 118
      },
      {
        question_id: 'q2',
        answer_text: 'TCP是面向连接的可靠协议，提供流量控制、拥塞控制和错误重传，适用于文件传输、网页浏览等需要可靠性的场景。UDP是无连接的不可靠协议，传输速度快，开销小，适用于视频直播、在线游戏等对实时性要求高的应用。',
        word_count: 89
      },
      {
        question_id: 'q3',
        answer_text: 'IPv4地址分为A、B、C、D、E五类。A类(1-126)用于大型网络，B类(128-191)用于中型网络，C类(192-223)用于小型网络。子网掩码用于区分网络部分和主机部分，实现网络划分。',
        word_count: 76
      }
    ]
  },
  {
    student_id: 'student-002', 
    student_name: '李四',
    answers: [
      {
        question_id: 'q1',
        answer_text: 'OSI模型有七层，包括物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。每层负责不同的功能。',
        word_count: 42
      },
      {
        question_id: 'q2',
        answer_text: 'TCP比较可靠，UDP比较快。TCP用于网页，UDP用于游戏。',
        word_count: 24
      },
      {
        question_id: 'q3',
        answer_text: '', // 未回答
        word_count: 0
      }
    ]
  },
  {
    student_id: 'student-003',
    student_name: '王五', 
    answers: [
      {
        question_id: 'q1',
        answer_text: 'OSI七层网络模型是国际标准化组织制定的网络通信标准。物理层负责比特流的物理传输，包括电气特性、机械特性等；数据链路层负责帧的传输，提供错误检测和纠正功能；网络层实现路由选择和逻辑寻址，主要协议是IP；传输层提供端到端的可靠传输，主要协议有TCP和UDP；会话层负责建立、管理和终止会话；表示层负责数据的格式转换、加密解密、压缩解压；应用层为用户应用程序提供网络服务接口。各层之间通过标准接口进行通信，实现了网络功能的模块化设计。',
        word_count: 178
      },
      {
        question_id: 'q2',
        answer_text: 'TCP(传输控制协议)和UDP(用户数据报协议)是传输层的两个主要协议。TCP是面向连接的可靠协议，具有以下特点：1)连接导向：通信前需要建立连接；2)可靠传输：提供确认、重传机制；3)流量控制：防止发送方发送过快；4)拥塞控制：避免网络拥塞。适用于HTTP、FTP、SMTP等。UDP是无连接的不可靠协议，特点是：1)无连接：直接发送数据；2)不可靠：不保证数据到达；3)开销小：头部只有8字节；4)实时性好。适用于DNS、DHCP、视频流等对实时性要求高的应用。',
        word_count: 186
      },
      {
        question_id: 'q3',
        answer_text: 'IPv4地址采用分类编址方式，分为A、B、C、D、E五类。A类地址(1.0.0.0-126.255.255.255)网络位8位，主机位24位，适用于大型网络；B类地址(128.0.0.0-191.255.255.255)网络位16位，主机位16位，适用于中型网络；C类地址(192.0.0.0-223.255.255.255)网络位24位，主机位8位，适用于小型网络。子网掩码用于标识IP地址中的网络部分和主机部分，通过与IP地址进行按位与运算，可以得到网络地址，实现网络的逻辑划分和路由选择。',
        word_count: 171
      }
    ]
  }
];

// 模拟AI评分函数
function gradeSubmission(questionnaire, questions, answers) {
  const maxScore = questionnaire.max_score;
  let totalScore = 0;
  const detailedFeedback = [];
  
  for (const question of questions) {
    const answer = answers.find(a => a.question_id === question.id);
    let questionScore = 0;
    let feedback = '';
    let strengths = [];
    let improvements = [];
    
    if (!answer || !answer.answer_text.trim()) {
      questionScore = 0;
      feedback = '未提供答案，建议认真思考问题并给出完整回答。';
      improvements = ['请提供答案', '仔细阅读问题要求'];
    } else {
      const wordCount = answer.word_count || answer.answer_text.length;
      
      // 基于内容质量和长度的评分
      if (wordCount < 20) {
        questionScore = Math.floor(maxScore * 0.25);
        feedback = '答案过于简短，缺乏必要的技术细节。';
        improvements = ['增加技术细节', '提供具体例子', '深入解释概念'];
      } else if (wordCount < 50) {
        questionScore = Math.floor(maxScore * 0.45);
        feedback = '答案基本正确但过于简单，需要更多技术深度。';
        strengths = ['基本概念正确'];
        improvements = ['增加技术深度', '提供更多细节', '举例说明'];
      } else if (wordCount < 100) {
        questionScore = Math.floor(maxScore * 0.65);
        feedback = '答案较为完整，技术概念基本正确，表达清晰。';
        strengths = ['概念理解正确', '表达清晰'];
        improvements = ['可以进一步深入分析', '增加实际应用例子'];
      } else if (wordCount < 150) {
        questionScore = Math.floor(maxScore * 0.80);
        feedback = '答案详细完整，技术理解深入，逻辑清晰。';
        strengths = ['技术理解深入', '逻辑清晰', '内容完整'];
        improvements = ['继续保持这种回答质量'];
      } else {
        questionScore = Math.floor(maxScore * 0.90);
        feedback = '答案非常详细完整，显示了深入的技术理解和优秀的表达能力。';
        strengths = ['技术理解深入', '表达能力优秀', '内容详实', '逻辑严密'];
        improvements = ['继续保持这种优秀的回答质量'];
      }
      
      // 字数限制检查
      if (question.word_limit && wordCount > question.word_limit) {
        questionScore = Math.floor(questionScore * 0.95);
        improvements.push('注意控制答案长度在限制范围内');
      }
    }
    
    totalScore += questionScore;
    detailedFeedback.push({
      question_id: question.id,
      score: questionScore,
      feedback,
      strengths,
      improvements
    });
  }
  
  const averageScore = Math.floor(totalScore / questions.length);
  
  let overallFeedback = '';
  if (averageScore >= 85) {
    overallFeedback = '优秀！显示了对计算机网络概念的深入理解和优秀的技术表达能力。';
  } else if (averageScore >= 70) {
    overallFeedback = '良好！基本掌握了核心概念，但在技术深度和表达完整性方面还有提升空间。';
  } else if (averageScore >= 60) {
    overallFeedback = '及格！对基本概念有一定理解，但需要加强技术细节的学习和表达能力的提升。';
  } else {
    overallFeedback = '需要努力！建议重新学习相关概念，加强理解，并提高答题的完整性。';
  }
  
  return {
    overall_score: averageScore,
    overall_feedback: overallFeedback,
    detailed_feedback: detailedFeedback,
    criteria_scores: {
      '技术准确性': Math.floor(averageScore * 0.30),
      '理解深度': Math.floor(averageScore * 0.30), 
      '逻辑表达': Math.floor(averageScore * 0.25),
      '完整性': Math.floor(averageScore * 0.15)
    },
    suggestions: [
      '多阅读计算机网络相关技术文档',
      '结合实际应用场景理解概念',
      '注意答案的逻辑结构和表达清晰度'
    ]
  };
}

// 执行演示
function runDemo() {
  console.log('📚 问答信息:');
  console.log(`标题: ${questionnaireData.title}`);
  console.log(`描述: ${questionnaireData.description}`);
  console.log(`总分: ${questionnaireData.max_score}分`);
  console.log(`问题数量: ${questions.length}题\n`);
  
  console.log('📝 问题列表:');
  questions.forEach((q, index) => {
    console.log(`${index + 1}. ${q.title} (${q.required ? '必答' : '选答'}, 限${q.word_limit}字)`);
  });
  console.log('');
  
  console.log('🎯 开始批量AI评分...\n');
  
  submissions.forEach((submission, index) => {
    console.log(`👤 学生${index + 1}: ${submission.student_name}`);
    console.log('─'.repeat(50));
    
    const result = gradeSubmission(questionnaireData, questions, submission.answers);
    
    console.log(`📊 总分: ${result.overall_score}/${questionnaireData.max_score}`);
    console.log(`💬 总评: ${result.overall_feedback}`);
    console.log('');
    
    console.log('📋 详细评分:');
    result.detailed_feedback.forEach((feedback, qIndex) => {
      const question = questions.find(q => q.id === feedback.question_id);
      const answer = submission.answers.find(a => a.question_id === feedback.question_id);
      
      console.log(`  问题${qIndex + 1}: ${question?.title}`);
      console.log(`  得分: ${feedback.score}分`);
      console.log(`  答案: ${answer?.answer_text || '未回答'}`);
      console.log(`  评价: ${feedback.feedback}`);
      if (feedback.strengths.length > 0) {
        console.log(`  优点: ${feedback.strengths.join(', ')}`);
      }
      console.log(`  建议: ${feedback.improvements.join(', ')}`);
      console.log('');
    });
    
    console.log('📈 分项得分:');
    Object.entries(result.criteria_scores).forEach(([criteria, score]) => {
      console.log(`  ${criteria}: ${score}分`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
  });
  
  console.log('🎉 批量AI评分演示完成！');
  console.log('\n✨ 功能特点:');
  console.log('• 智能评分算法，基于答案质量自动评分');
  console.log('• 详细反馈，包含优点和改进建议');
  console.log('• 分项评分，多维度评估学生能力');
  console.log('• 字数限制检查，培养学生表达能力');
  console.log('• 批量处理，提高教师工作效率');
}

// 运行演示
runDemo();
