/**
 * AI 教育公司员工 Mock 数据
 *
 * 每位员工有完整的 RPG 风格属性系统：
 * - 五维属性：教学力、研发力、创造力、影响力、协作力
 * - 技能树：专业技能 + 等级
 * - 成长记录：里程碑事件
 * - 博客文章列表
 */

export interface Skill {
  readonly name: string
  readonly level: number      // 1-10
  readonly icon: string       // emoji
  readonly category: 'tech' | 'teaching' | 'design' | 'management' | 'research'
}

export interface Milestone {
  readonly date: string       // YYYY-MM
  readonly title: string
  readonly description: string
  readonly icon: string
}

export interface BlogPost {
  readonly title: string
  readonly date: string
  readonly summary: string
  readonly tags: readonly string[]
}

export interface Stats {
  readonly teaching: number    // 教学力 1-100
  readonly research: number    // 研发力
  readonly creativity: number  // 创造力
  readonly influence: number   // 影响力
  readonly teamwork: number    // 协作力
}

export interface EmployeeProfile {
  readonly id: number
  readonly name: string
  readonly englishName: string
  readonly department: string
  readonly role: string
  readonly level: string       // 职级：初级/中级/高级/资深/专家
  readonly avatarSeed: number
  readonly bio: string
  readonly motto: string       // 状态签名
  readonly joinDate: string    // YYYY-MM
  readonly stats: Stats
  readonly skills: readonly Skill[]
  readonly milestones: readonly Milestone[]
  readonly blogs: readonly BlogPost[]
  readonly tags: readonly string[]   // 个人标签
}

export const DEPARTMENTS = [
  { id: 'ai_research', name: 'AI 研究院', color: '#6a5acd', icon: '🧠' },
  { id: 'curriculum', name: '课程研发部', color: '#2e8b57', icon: '📚' },
  { id: 'teaching', name: '教学部', color: '#cd853f', icon: '🎓' },
  { id: 'engineering', name: '工程部', color: '#4682b4', icon: '⚙️' },
  { id: 'product', name: '产品部', color: '#da70d6', icon: '💡' },
  { id: 'design', name: '设计部', color: '#ff6347', icon: '🎨' },
  { id: 'operations', name: '运营部', color: '#20b2aa', icon: '📊' },
  { id: 'marketing', name: '市场部', color: '#ff8c00', icon: '📣' },
] as const

const EMPLOYEES: readonly EmployeeProfile[] = [
  // === AI 研究院 ===
  {
    id: 0,
    name: '林博远',
    englishName: 'Bryan Lin',
    department: 'AI 研究院',
    role: '首席 AI 科学家',
    level: '专家',
    avatarSeed: 1001,
    bio: '前 Google Brain 研究员，专注大语言模型与教育 AI 交叉领域。发表 ACL/NeurIPS 论文 12 篇，主导公司核心 AI 教学引擎研发。',
    motto: '让 AI 成为每个学生的私人导师',
    joinDate: '2022-03',
    stats: { teaching: 65, research: 98, creativity: 88, influence: 92, teamwork: 75 },
    skills: [
      { name: 'LLM Fine-tuning', level: 10, icon: '🤖', category: 'research' },
      { name: 'Prompt Engineering', level: 9, icon: '✨', category: 'tech' },
      { name: 'PyTorch', level: 9, icon: '🔥', category: 'tech' },
      { name: '论文写作', level: 8, icon: '📝', category: 'research' },
      { name: '教育心理学', level: 6, icon: '🧠', category: 'teaching' },
    ],
    milestones: [
      { date: '2022-03', title: '加入公司', description: '从 Google Brain 加入，组建 AI 研究院', icon: '🚀' },
      { date: '2022-09', title: 'AI 教学引擎 v1', description: '完成第一版基于 GPT 的智能教学系统', icon: '🏆' },
      { date: '2023-06', title: 'NeurIPS 收录', description: '教育领域 AI 论文被 NeurIPS 接收', icon: '📄' },
      { date: '2024-01', title: '团队扩张', description: 'AI 研究院扩展到 8 人团队', icon: '👥' },
      { date: '2024-11', title: '多模态教学', description: '上线多模态 AI 教学系统，支持语音和图像', icon: '🎯' },
    ],
    blogs: [
      { title: '大模型在教育场景的 10 个最佳实践', date: '2024-10', summary: '总结了在教育领域部署 LLM 的关键经验...', tags: ['LLM', '教育AI'] },
      { title: 'RAG 在知识问答中的优化策略', date: '2024-08', summary: '深入探讨 RAG 架构在教育问答系统中的应用...', tags: ['RAG', '技术'] },
      { title: '从 Google 到创业：AI 教育的无限可能', date: '2023-03', summary: '回顾从大厂到创业的心路历程...', tags: ['个人成长', '创业'] },
    ],
    tags: ['NeurIPS', '大模型', '教育AI', '技术leader'],
  },
  {
    id: 1,
    name: '赵思瑶',
    englishName: 'Sophie Zhao',
    department: 'AI 研究院',
    role: 'AI 算法工程师',
    level: '高级',
    avatarSeed: 1002,
    bio: '清华大学计算机博士，专注自然语言处理和知识图谱。负责公司 AI 问答系统的核心算法迭代。',
    motto: '用算法让知识流动起来',
    joinDate: '2022-06',
    stats: { teaching: 45, research: 92, creativity: 78, influence: 60, teamwork: 82 },
    skills: [
      { name: 'NLP', level: 9, icon: '📖', category: 'research' },
      { name: '知识图谱', level: 8, icon: '🕸️', category: 'research' },
      { name: 'Python', level: 9, icon: '🐍', category: 'tech' },
      { name: 'Transformers', level: 8, icon: '🔄', category: 'tech' },
      { name: '数据分析', level: 7, icon: '📊', category: 'tech' },
    ],
    milestones: [
      { date: '2022-06', title: '加入公司', description: '博士毕业直接加入 AI 研究院', icon: '🎓' },
      { date: '2023-02', title: '知识图谱上线', description: '构建教育领域知识图谱，涵盖 10 万知识点', icon: '🕸️' },
      { date: '2023-12', title: 'AI 问答准确率 95%', description: '将 AI 问答准确率从 78% 提升到 95%', icon: '📈' },
    ],
    blogs: [
      { title: '教育知识图谱构建实战', date: '2024-05', summary: '如何为 K12 教育构建高质量知识图谱...', tags: ['知识图谱', '教育'] },
      { title: 'Fine-tuning vs RAG：教育场景下的选择', date: '2024-02', summary: '对比两种主流方案在教育场景的表现...', tags: ['LLM', '技术选型'] },
    ],
    tags: ['NLP', '知识图谱', '清华', '算法'],
  },
  {
    id: 2,
    name: '陈子轩',
    englishName: 'Alex Chen',
    department: 'AI 研究院',
    role: 'AI 训练工程师',
    level: '中级',
    avatarSeed: 1003,
    bio: '负责模型训练和推理优化，擅长分布式训练和模型量化。GPU 集群管理专家。',
    motto: '让模型跑得更快更省',
    joinDate: '2023-04',
    stats: { teaching: 30, research: 85, creativity: 65, influence: 40, teamwork: 78 },
    skills: [
      { name: '分布式训练', level: 8, icon: '🖥️', category: 'tech' },
      { name: '模型量化', level: 7, icon: '📦', category: 'tech' },
      { name: 'CUDA', level: 7, icon: '💻', category: 'tech' },
      { name: 'MLOps', level: 6, icon: '🔧', category: 'tech' },
    ],
    milestones: [
      { date: '2023-04', title: '加入公司', description: '从字节跳动跳槽加入', icon: '🚀' },
      { date: '2023-10', title: '推理速度提升 3x', description: '通过量化和优化将模型推理速度提升 3 倍', icon: '⚡' },
    ],
    blogs: [
      { title: '教育大模型的推理优化实践', date: '2024-07', summary: '如何在有限 GPU 资源下优化教育模型推理...', tags: ['MLOps', '优化'] },
    ],
    tags: ['MLOps', 'GPU', '推理优化'],
  },

  // === 课程研发部 ===
  {
    id: 3,
    name: '王雅琳',
    englishName: 'Yarin Wang',
    department: '课程研发部',
    role: '课程总监',
    level: '资深',
    avatarSeed: 2001,
    bio: '10 年教育行业经验，曾任知名在线教育平台课程负责人。擅长将 AI 技术与教学设计深度融合。',
    motto: '好课程是设计出来的',
    joinDate: '2022-04',
    stats: { teaching: 95, research: 60, creativity: 90, influence: 85, teamwork: 88 },
    skills: [
      { name: '课程设计', level: 10, icon: '📐', category: 'teaching' },
      { name: '教学法', level: 9, icon: '📚', category: 'teaching' },
      { name: 'AI 辅助教学', level: 8, icon: '🤖', category: 'teaching' },
      { name: '内容运营', level: 7, icon: '📝', category: 'management' },
      { name: '用户研究', level: 7, icon: '🔍', category: 'design' },
    ],
    milestones: [
      { date: '2022-04', title: '加入公司', description: '出任课程研发部负责人', icon: '🚀' },
      { date: '2022-12', title: '首批 AI 课程上线', description: '完成 50 门 AI 基础课程的设计和上线', icon: '📚' },
      { date: '2023-08', title: '学员突破 10 万', description: '课程累计学员突破 10 万人', icon: '🎉' },
      { date: '2024-05', title: '个性化学习路径', description: '上线 AI 驱动的个性化学习路径推荐', icon: '🗺️' },
    ],
    blogs: [
      { title: 'AI 时代的课程设计新范式', date: '2024-09', summary: 'AI 如何重新定义课程设计流程...', tags: ['课程设计', 'AI'] },
      { title: '从 0 到 10 万：AI 教育课程的增长之路', date: '2024-03', summary: '分享课程体系从无到有的建设经验...', tags: ['增长', '教育'] },
    ],
    tags: ['课程设计', '教学法', '10万学员', '内容专家'],
  },
  {
    id: 4,
    name: '刘明远',
    englishName: 'Marco Liu',
    department: '课程研发部',
    role: 'Prompt 课程设计师',
    level: '中级',
    avatarSeed: 2002,
    bio: '负责 Prompt Engineering 系列课程开发，将复杂的 AI 概念转化为易懂的学习内容。',
    motto: '把复杂变简单',
    joinDate: '2023-02',
    stats: { teaching: 82, research: 55, creativity: 88, influence: 50, teamwork: 75 },
    skills: [
      { name: 'Prompt Engineering', level: 8, icon: '✨', category: 'tech' },
      { name: '课程脚本', level: 7, icon: '🎬', category: 'teaching' },
      { name: '交互设计', level: 6, icon: '🖱️', category: 'design' },
      { name: '视频制作', level: 5, icon: '🎥', category: 'design' },
    ],
    milestones: [
      { date: '2023-02', title: '加入公司', description: '从自媒体转型加入课程团队', icon: '🚀' },
      { date: '2023-09', title: 'Prompt 课程爆款', description: 'Prompt Engineering 入门课播放量破百万', icon: '🔥' },
    ],
    blogs: [
      { title: '如何设计一门让人上瘾的 AI 课程', date: '2024-06', summary: '游戏化设计在 AI 教育中的应用...', tags: ['课程设计', '游戏化'] },
    ],
    tags: ['Prompt', '课程设计', '内容创作'],
  },
  {
    id: 5,
    name: '张晓萱',
    englishName: 'Sharon Zhang',
    department: '课程研发部',
    role: '学习体验设计师',
    level: '中级',
    avatarSeed: 2003,
    bio: '专注学习体验(LX)设计，运用认知科学原理优化在线学习效果。',
    motto: '让学习变成一场冒险',
    joinDate: '2023-05',
    stats: { teaching: 75, research: 50, creativity: 92, influence: 45, teamwork: 80 },
    skills: [
      { name: '学习体验设计', level: 8, icon: '🎯', category: 'design' },
      { name: '认知科学', level: 7, icon: '🧠', category: 'research' },
      { name: '原型设计', level: 7, icon: '🎨', category: 'design' },
      { name: '用户测试', level: 6, icon: '🔬', category: 'design' },
    ],
    milestones: [
      { date: '2023-05', title: '加入公司', description: '从互联网教育公司加入', icon: '🚀' },
      { date: '2024-02', title: '学习完成率提升 40%', description: '重新设计学习路径，完成率从 35% 提升到 50%', icon: '📈' },
    ],
    blogs: [
      { title: '认知负荷理论在 AI 教育中的应用', date: '2024-04', summary: '如何降低 AI 课程的认知负荷...', tags: ['认知科学', '教学设计'] },
    ],
    tags: ['LX设计', '认知科学', '交互设计'],
  },

  // === 教学部 ===
  {
    id: 6,
    name: '杨思远',
    englishName: 'Simon Yang',
    department: '教学部',
    role: '高级 AI 讲师',
    level: '资深',
    avatarSeed: 3001,
    bio: '全栈开发者转型 AI 讲师，擅长用生动案例讲解复杂技术。B站粉丝 50 万，被学生称为"AI 界说人话的老师"。',
    motto: '技术不是门槛，而是阶梯',
    joinDate: '2022-05',
    stats: { teaching: 98, research: 55, creativity: 85, influence: 95, teamwork: 70 },
    skills: [
      { name: '授课能力', level: 10, icon: '🎤', category: 'teaching' },
      { name: 'Python 教学', level: 9, icon: '🐍', category: 'teaching' },
      { name: 'AI 基础教学', level: 9, icon: '🤖', category: 'teaching' },
      { name: '视频制作', level: 7, icon: '🎥', category: 'design' },
      { name: '社区运营', level: 7, icon: '👥', category: 'management' },
    ],
    milestones: [
      { date: '2022-05', title: '加入公司', description: '首位全职讲师', icon: '🚀' },
      { date: '2023-01', title: 'B站 10 万粉', description: 'AI 教学视频累计 10 万粉丝', icon: '📺' },
      { date: '2023-11', title: 'B站 50 万粉', description: '成为 AI 教育领域头部 UP 主', icon: '🌟' },
      { date: '2024-08', title: '出版教材', description: '《人人都能学会的 AI》正式出版', icon: '📖' },
    ],
    blogs: [
      { title: '如何让零基础学生爱上 AI', date: '2024-11', summary: '分享从 0 到 1 教授 AI 课程的心得...', tags: ['教学', 'AI入门'] },
      { title: '我在 B 站教 AI 的这两年', date: '2024-06', summary: '从程序员到 UP 主的转型故事...', tags: ['个人成长', 'B站'] },
    ],
    tags: ['明星讲师', 'B站50万粉', '出版作者', 'Python'],
  },
  {
    id: 7,
    name: '黄梦琪',
    englishName: 'Maggie Huang',
    department: '教学部',
    role: 'AI 讲师',
    level: '中级',
    avatarSeed: 3002,
    bio: '数学教育背景，专注 AI 数学基础教学。擅长可视化讲解线性代数、概率论等底层数学。',
    motto: '数学是 AI 的语言',
    joinDate: '2023-03',
    stats: { teaching: 88, research: 62, creativity: 72, influence: 55, teamwork: 80 },
    skills: [
      { name: '数学教学', level: 9, icon: '📐', category: 'teaching' },
      { name: '可视化讲解', level: 8, icon: '📊', category: 'teaching' },
      { name: '线性代数', level: 8, icon: '🔢', category: 'research' },
      { name: 'LaTeX', level: 7, icon: '📝', category: 'tech' },
    ],
    milestones: [
      { date: '2023-03', title: '加入公司', description: '从高中数学老师转型', icon: '🚀' },
      { date: '2024-01', title: '数学课好评率 98%', description: 'AI 数学基础课获得 98% 好评率', icon: '⭐' },
    ],
    blogs: [
      { title: '用动画讲清楚反向传播', date: '2024-09', summary: '如何用可视化方式让学生理解 BP 算法...', tags: ['数学', '可视化'] },
    ],
    tags: ['数学', '可视化', '高评分讲师'],
  },
  {
    id: 8,
    name: '周浩然',
    englishName: 'Howard Zhou',
    department: '教学部',
    role: '助教主管',
    level: '中级',
    avatarSeed: 3003,
    bio: '管理 20 人助教团队，搭建了高效的学员答疑和作业批改体系。',
    motto: '每个问题都值得被认真回答',
    joinDate: '2023-06',
    stats: { teaching: 78, research: 35, creativity: 55, influence: 45, teamwork: 95 },
    skills: [
      { name: '团队管理', level: 7, icon: '👥', category: 'management' },
      { name: '学员服务', level: 8, icon: '🤝', category: 'teaching' },
      { name: 'AI 基础', level: 6, icon: '🤖', category: 'tech' },
      { name: '数据分析', level: 5, icon: '📊', category: 'tech' },
    ],
    milestones: [
      { date: '2023-06', title: '加入公司', description: '建立助教团队体系', icon: '🚀' },
      { date: '2024-03', title: '助教响应 < 10min', description: '学员提问平均响应时间降至 10 分钟内', icon: '⚡' },
    ],
    blogs: [],
    tags: ['助教管理', '学员服务', '团队建设'],
  },

  // === 工程部 ===
  {
    id: 9,
    name: '吴子涵',
    englishName: 'Han Wu',
    department: '工程部',
    role: '技术总监',
    level: '专家',
    avatarSeed: 4001,
    bio: '前阿里 P8，主导公司技术架构设计。从零搭建了支撑百万用户的在线学习平台。',
    motto: '架构决定上限',
    joinDate: '2022-03',
    stats: { teaching: 40, research: 78, creativity: 72, influence: 88, teamwork: 85 },
    skills: [
      { name: '系统架构', level: 10, icon: '🏗️', category: 'tech' },
      { name: 'TypeScript', level: 9, icon: '📘', category: 'tech' },
      { name: 'Kubernetes', level: 8, icon: '☸️', category: 'tech' },
      { name: '技术管理', level: 8, icon: '👨‍💼', category: 'management' },
      { name: 'Go', level: 7, icon: '🐹', category: 'tech' },
    ],
    milestones: [
      { date: '2022-03', title: '加入公司', description: '联合创始人，负责技术团队', icon: '🚀' },
      { date: '2022-08', title: '平台 v1 上线', description: '3 个月内完成学习平台 MVP', icon: '🏆' },
      { date: '2023-06', title: '百万用户', description: '平台注册用户突破 100 万', icon: '🎉' },
      { date: '2024-03', title: '微服务改造', description: '完成单体到微服务架构迁移', icon: '🔧' },
    ],
    blogs: [
      { title: '从单体到微服务：AI 教育平台架构演进', date: '2024-06', summary: '分享平台架构从 0 到百万用户的演进之路...', tags: ['架构', '微服务'] },
      { title: '在线教育平台的实时互动技术选型', date: '2023-11', summary: '直播、实时协作、低延迟通信的技术选型...', tags: ['实时互动', '技术选型'] },
    ],
    tags: ['CTO', '架构师', '阿里P8', '百万用户'],
  },
  {
    id: 10,
    name: '徐嘉瑞',
    englishName: 'Jerry Xu',
    department: '工程部',
    role: '前端负责人',
    level: '高级',
    avatarSeed: 4002,
    bio: '专注 React 生态 5 年，负责学习平台的前端架构和用户体验。',
    motto: '像素级追求完美',
    joinDate: '2022-07',
    stats: { teaching: 35, research: 55, creativity: 82, influence: 50, teamwork: 88 },
    skills: [
      { name: 'React', level: 9, icon: '⚛️', category: 'tech' },
      { name: 'TypeScript', level: 9, icon: '📘', category: 'tech' },
      { name: 'PixiJS', level: 7, icon: '🎮', category: 'tech' },
      { name: '性能优化', level: 8, icon: '⚡', category: 'tech' },
      { name: 'CSS 动画', level: 7, icon: '🎨', category: 'design' },
    ],
    milestones: [
      { date: '2022-07', title: '加入公司', description: '搭建前端团队', icon: '🚀' },
      { date: '2023-04', title: '组件库 v1', description: '完成内部 UI 组件库建设', icon: '🧩' },
      { date: '2024-06', title: 'Lighthouse 95+', description: '平台首页 Lighthouse 评分全项 95+', icon: '💯' },
    ],
    blogs: [
      { title: 'PixiJS 在教育互动场景的实践', date: '2024-08', summary: 'WebGL 2D 渲染在教育互动中的应用...', tags: ['PixiJS', 'WebGL'] },
    ],
    tags: ['React', 'PixiJS', '前端架构'],
  },
  {
    id: 11,
    name: '孙铭哲',
    englishName: 'Mike Sun',
    department: '工程部',
    role: '后端工程师',
    level: '中级',
    avatarSeed: 4003,
    bio: 'Go 语言爱好者，负责课程服务和用户系统的后端开发。',
    motto: 'Less is more',
    joinDate: '2023-01',
    stats: { teaching: 25, research: 68, creativity: 55, influence: 35, teamwork: 82 },
    skills: [
      { name: 'Go', level: 8, icon: '🐹', category: 'tech' },
      { name: 'PostgreSQL', level: 7, icon: '🐘', category: 'tech' },
      { name: 'gRPC', level: 7, icon: '🔌', category: 'tech' },
      { name: 'Docker', level: 6, icon: '🐳', category: 'tech' },
    ],
    milestones: [
      { date: '2023-01', title: '加入公司', description: '首位后端开发工程师', icon: '🚀' },
      { date: '2023-09', title: '课程服务重构', description: '将课程微服务 QPS 从 500 提升到 5000', icon: '📈' },
    ],
    blogs: [
      { title: 'Go 微服务在教育平台的实战', date: '2024-04', summary: '分享 Go 在高并发教育场景的应用...', tags: ['Go', '微服务'] },
    ],
    tags: ['Go', '后端', '微服务'],
  },
  {
    id: 12,
    name: '胡晓楠',
    englishName: 'Nancy Hu',
    department: '工程部',
    role: '全栈工程师',
    level: '中级',
    avatarSeed: 4004,
    bio: '全栈选手，擅长快速原型开发。负责内部工具和 AI 实验平台建设。',
    motto: 'Ship it!',
    joinDate: '2023-07',
    stats: { teaching: 30, research: 50, creativity: 78, influence: 38, teamwork: 75 },
    skills: [
      { name: 'Next.js', level: 8, icon: '▲', category: 'tech' },
      { name: 'Python', level: 7, icon: '🐍', category: 'tech' },
      { name: 'Tailwind CSS', level: 7, icon: '🎨', category: 'tech' },
      { name: '快速原型', level: 8, icon: '🚀', category: 'tech' },
    ],
    milestones: [
      { date: '2023-07', title: '加入公司', description: '负责内部工具开发', icon: '🚀' },
      { date: '2024-01', title: 'AI 实验平台', description: '搭建在线 AI 编程实验环境', icon: '🧪' },
    ],
    blogs: [],
    tags: ['全栈', 'Next.js', '快速原型'],
  },
  {
    id: 13,
    name: '马瑞阳',
    englishName: 'Ryan Ma',
    department: '工程部',
    role: 'DevOps 工程师',
    level: '中级',
    avatarSeed: 4005,
    bio: '负责 CI/CD 流水线和云基础设施。确保平台 99.9% 可用性。',
    motto: '自动化一切可自动化的',
    joinDate: '2023-03',
    stats: { teaching: 20, research: 55, creativity: 50, influence: 30, teamwork: 78 },
    skills: [
      { name: 'Kubernetes', level: 8, icon: '☸️', category: 'tech' },
      { name: 'Terraform', level: 7, icon: '🏗️', category: 'tech' },
      { name: 'GitHub Actions', level: 7, icon: '🔄', category: 'tech' },
      { name: '监控告警', level: 7, icon: '🔔', category: 'tech' },
    ],
    milestones: [
      { date: '2023-03', title: '加入公司', description: '建立 DevOps 体系', icon: '🚀' },
      { date: '2023-12', title: 'SLA 99.9%', description: '平台可用性达到 99.9%', icon: '🏆' },
    ],
    blogs: [],
    tags: ['DevOps', 'K8s', 'SRE'],
  },

  // === 产品部 ===
  {
    id: 14,
    name: '高悦宁',
    englishName: 'Joy Gao',
    department: '产品部',
    role: '产品总监',
    level: '资深',
    avatarSeed: 5001,
    bio: '前网易产品经理，专注教育产品 8 年。主导公司 AI 学习平台的产品规划和用户增长策略。',
    motto: '用户第一，数据说话',
    joinDate: '2022-05',
    stats: { teaching: 55, research: 45, creativity: 88, influence: 82, teamwork: 90 },
    skills: [
      { name: '产品规划', level: 9, icon: '🗺️', category: 'management' },
      { name: '数据驱动', level: 8, icon: '📊', category: 'management' },
      { name: '用户增长', level: 8, icon: '📈', category: 'management' },
      { name: 'AI 产品', level: 7, icon: '🤖', category: 'management' },
      { name: '竞品分析', level: 7, icon: '🔍', category: 'management' },
    ],
    milestones: [
      { date: '2022-05', title: '加入公司', description: '负责产品整体规划', icon: '🚀' },
      { date: '2023-03', title: 'DAU 破万', description: '日活跃用户突破 1 万', icon: '📈' },
      { date: '2024-01', title: 'AI 助教上线', description: '上线 AI 智能助教功能，留存提升 25%', icon: '🤖' },
    ],
    blogs: [
      { title: 'AI 教育产品的 PMF 之路', date: '2024-07', summary: '如何找到 AI 教育产品的 Product-Market Fit...', tags: ['产品', 'PMF'] },
    ],
    tags: ['产品总监', '网易', '用户增长', 'PMF'],
  },
  {
    id: 15,
    name: '罗嘉文',
    englishName: 'Kevin Luo',
    department: '产品部',
    role: '产品经理',
    level: '中级',
    avatarSeed: 5002,
    bio: '负责 AI 编程练习模块的产品设计，致力于让编程学习更有趣。',
    motto: '好产品是用出来的',
    joinDate: '2023-05',
    stats: { teaching: 40, research: 38, creativity: 80, influence: 42, teamwork: 85 },
    skills: [
      { name: '需求分析', level: 7, icon: '📋', category: 'management' },
      { name: '原型设计', level: 7, icon: '🎨', category: 'design' },
      { name: 'SQL', level: 5, icon: '🗃️', category: 'tech' },
      { name: '用户访谈', level: 7, icon: '🗣️', category: 'management' },
    ],
    milestones: [
      { date: '2023-05', title: '加入公司', description: '负责编程练习模块', icon: '🚀' },
      { date: '2024-04', title: 'AI 代码审查', description: '上线 AI 自动代码审查功能', icon: '🔍' },
    ],
    blogs: [],
    tags: ['产品经理', '编程教育', '需求分析'],
  },

  // === 设计部 ===
  {
    id: 16,
    name: '朱梦瑶',
    englishName: 'Mia Zhu',
    department: '设计部',
    role: '设计负责人',
    level: '高级',
    avatarSeed: 6001,
    bio: '视觉设计出身，负责公司品牌视觉和产品 UI/UX。打造了清新活泼的 AI 教育品牌形象。',
    motto: '设计是解决问题的艺术',
    joinDate: '2022-06',
    stats: { teaching: 30, research: 35, creativity: 98, influence: 72, teamwork: 80 },
    skills: [
      { name: 'UI 设计', level: 9, icon: '🎨', category: 'design' },
      { name: 'Figma', level: 9, icon: '🖌️', category: 'design' },
      { name: '品牌设计', level: 8, icon: '✨', category: 'design' },
      { name: '动效设计', level: 7, icon: '🎬', category: 'design' },
      { name: '像素艺术', level: 6, icon: '🕹️', category: 'design' },
    ],
    milestones: [
      { date: '2022-06', title: '加入公司', description: '搭建设计团队', icon: '🚀' },
      { date: '2022-10', title: '品牌 VI 体系', description: '完成公司品牌 VI 设计', icon: '🎨' },
      { date: '2024-02', title: '设计系统 v2', description: '上线第二版设计系统，涵盖 200+ 组件', icon: '🧩' },
    ],
    blogs: [
      { title: 'AI 教育产品的情感化设计', date: '2024-05', summary: '如何通过设计让学习变得温暖和愉悦...', tags: ['UI设计', '情感化'] },
    ],
    tags: ['UI/UX', 'Figma', '品牌设计', '设计系统'],
  },
  {
    id: 17,
    name: '何文斌',
    englishName: 'Bin He',
    department: '设计部',
    role: '插画师 / 像素艺术家',
    level: '中级',
    avatarSeed: 6002,
    bio: '像素艺术爱好者，负责平台的插画、图标和游戏化视觉元素设计。PixelTown 的主要美术设计者。',
    motto: '每个像素都有意义',
    joinDate: '2023-04',
    stats: { teaching: 20, research: 25, creativity: 95, influence: 48, teamwork: 70 },
    skills: [
      { name: '像素艺术', level: 9, icon: '🕹️', category: 'design' },
      { name: '插画', level: 8, icon: '🖼️', category: 'design' },
      { name: 'Aseprite', level: 8, icon: '🎮', category: 'design' },
      { name: 'Unity 2D', level: 5, icon: '🎯', category: 'tech' },
    ],
    milestones: [
      { date: '2023-04', title: '加入公司', description: '负责游戏化视觉元素', icon: '🚀' },
      { date: '2023-11', title: 'PixelTown 概念', description: '设计 PixelTown 的初始概念和美术风格', icon: '🎨' },
      { date: '2024-08', title: '表情包上线', description: '设计的公司像素表情包在内部大受欢迎', icon: '😄' },
    ],
    blogs: [
      { title: '像素艺术在现代 UI 中的应用', date: '2024-10', summary: '如何在现代产品中融入复古像素风格...', tags: ['像素艺术', 'UI'] },
    ],
    tags: ['像素艺术', '插画', 'Aseprite', 'PixelTown设计师'],
  },

  // === 运营部 ===
  {
    id: 18,
    name: '李瑾萱',
    englishName: 'Jean Li',
    department: '运营部',
    role: '运营总监',
    level: '资深',
    avatarSeed: 7001,
    bio: '互联网运营老兵，负责用户运营、社区运营和内容运营。建立了活跃的 AI 学习社区。',
    motto: '运营就是让好事发生',
    joinDate: '2022-06',
    stats: { teaching: 50, research: 30, creativity: 75, influence: 88, teamwork: 92 },
    skills: [
      { name: '社区运营', level: 9, icon: '👥', category: 'management' },
      { name: '数据分析', level: 7, icon: '📊', category: 'tech' },
      { name: '活动策划', level: 8, icon: '🎪', category: 'management' },
      { name: '内容运营', level: 8, icon: '📝', category: 'management' },
    ],
    milestones: [
      { date: '2022-06', title: '加入公司', description: '搭建运营体系', icon: '🚀' },
      { date: '2023-05', title: '社区 5 万人', description: 'AI 学习社区成员突破 5 万', icon: '👥' },
      { date: '2024-06', title: '社区 20 万人', description: '社区规模突破 20 万，月活 5 万', icon: '🎉' },
    ],
    blogs: [
      { title: 'AI 学习社区的冷启动策略', date: '2024-03', summary: '如何从 0 建设一个活跃的 AI 学习社区...', tags: ['社区运营', '冷启动'] },
    ],
    tags: ['社区运营', '20万社区', '活动策划'],
  },
  {
    id: 19,
    name: '郭鑫宇',
    englishName: 'Xinyu Guo',
    department: '运营部',
    role: '数据分析师',
    level: '中级',
    avatarSeed: 7002,
    bio: '负责用户行为分析和学习效果评估，用数据驱动产品和运营决策。',
    motto: '数据不说谎',
    joinDate: '2023-08',
    stats: { teaching: 25, research: 65, creativity: 50, influence: 35, teamwork: 78 },
    skills: [
      { name: 'SQL', level: 8, icon: '🗃️', category: 'tech' },
      { name: 'Python 数据分析', level: 7, icon: '🐍', category: 'tech' },
      { name: 'Tableau', level: 7, icon: '📊', category: 'tech' },
      { name: 'A/B 测试', level: 6, icon: '🔬', category: 'tech' },
    ],
    milestones: [
      { date: '2023-08', title: '加入公司', description: '首位数据分析师', icon: '🚀' },
      { date: '2024-05', title: '数据看板体系', description: '建立完整的业务数据看板体系', icon: '📊' },
    ],
    blogs: [],
    tags: ['数据分析', 'SQL', 'A/B测试'],
  },

  // === 市场部 ===
  {
    id: 20,
    name: '陈嘉怡',
    englishName: 'Joy Chen',
    department: '市场部',
    role: '市场总监',
    level: '高级',
    avatarSeed: 8001,
    bio: '负责公司品牌推广和市场策略，曾在多家教育科技公司负责增长。',
    motto: '好内容是最好的营销',
    joinDate: '2022-08',
    stats: { teaching: 35, research: 28, creativity: 82, influence: 90, teamwork: 85 },
    skills: [
      { name: '品牌营销', level: 9, icon: '📣', category: 'management' },
      { name: '内容营销', level: 8, icon: '📝', category: 'management' },
      { name: 'SEO/SEM', level: 7, icon: '🔍', category: 'tech' },
      { name: '公关', level: 7, icon: '🤝', category: 'management' },
    ],
    milestones: [
      { date: '2022-08', title: '加入公司', description: '建立市场团队', icon: '🚀' },
      { date: '2023-09', title: '品牌知名度', description: '在 AI 教育领域品牌认知度进入 Top 5', icon: '📈' },
    ],
    blogs: [
      { title: 'AI 教育赛道的品牌差异化策略', date: '2024-08', summary: '在竞争激烈的 AI 教育赛道如何脱颖而出...', tags: ['品牌', '营销'] },
    ],
    tags: ['品牌营销', '增长', '教育科技'],
  },
  {
    id: 21,
    name: '林悦阳',
    englishName: 'Sunny Lin',
    department: '市场部',
    role: '新媒体运营',
    level: '初级',
    avatarSeed: 8002,
    bio: '00 后新媒体达人，负责公司抖音、小红书、微信公众号运营。用年轻人的方式讲 AI。',
    motto: '用有趣的方式传播知识',
    joinDate: '2024-01',
    stats: { teaching: 42, research: 20, creativity: 90, influence: 55, teamwork: 72 },
    skills: [
      { name: '短视频', level: 8, icon: '📱', category: 'design' },
      { name: '文案写作', level: 7, icon: '✍️', category: 'design' },
      { name: '小红书运营', level: 7, icon: '📕', category: 'management' },
      { name: '剪辑', level: 6, icon: '✂️', category: 'design' },
    ],
    milestones: [
      { date: '2024-01', title: '加入公司', description: '应届毕业生入职', icon: '🎓' },
      { date: '2024-06', title: '爆款内容', description: '一条 AI 科普短视频播放量破 500 万', icon: '🔥' },
    ],
    blogs: [],
    tags: ['新媒体', '短视频', '00后', '小红书'],
  },

  // === 更多员工填充 ===
  {
    id: 22,
    name: '赵博文',
    englishName: 'Bowen Zhao',
    department: 'AI 研究院',
    role: 'AI 应用工程师',
    level: '中级',
    avatarSeed: 1004,
    bio: '专注将研究成果转化为可用产品，是研究院和工程部的桥梁。',
    motto: '研究要落地才有价值',
    joinDate: '2023-09',
    stats: { teaching: 35, research: 75, creativity: 68, influence: 42, teamwork: 85 },
    skills: [
      { name: 'LangChain', level: 7, icon: '🔗', category: 'tech' },
      { name: 'FastAPI', level: 7, icon: '⚡', category: 'tech' },
      { name: 'Python', level: 8, icon: '🐍', category: 'tech' },
    ],
    milestones: [
      { date: '2023-09', title: '加入公司', description: '负责 AI 功能落地', icon: '🚀' },
    ],
    blogs: [],
    tags: ['AI工程化', 'LangChain', '落地'],
  },
  {
    id: 23,
    name: '黄晨阳',
    englishName: 'Chris Huang',
    department: '工程部',
    role: '前端工程师',
    level: '初级',
    avatarSeed: 4006,
    bio: '刚毕业的前端新人，学习能力强，负责编程练习模块的前端开发。',
    motto: '每天进步一点点',
    joinDate: '2024-03',
    stats: { teaching: 15, research: 30, creativity: 62, influence: 18, teamwork: 75 },
    skills: [
      { name: 'React', level: 5, icon: '⚛️', category: 'tech' },
      { name: 'CSS', level: 6, icon: '🎨', category: 'tech' },
      { name: 'JavaScript', level: 6, icon: '📜', category: 'tech' },
    ],
    milestones: [
      { date: '2024-03', title: '加入公司', description: '应届生入职工程部', icon: '🎓' },
    ],
    blogs: [],
    tags: ['新人', '前端', '应届生'],
  },
  {
    id: 24,
    name: '王思涵',
    englishName: 'Hannah Wang',
    department: '课程研发部',
    role: 'AI 绘画课程设计师',
    level: '中级',
    avatarSeed: 2004,
    bio: '美术科班出身，负责 AI 绘画和设计类课程开发。',
    motto: '创意无限',
    joinDate: '2023-08',
    stats: { teaching: 72, research: 40, creativity: 92, influence: 48, teamwork: 78 },
    skills: [
      { name: 'Stable Diffusion', level: 8, icon: '🎨', category: 'tech' },
      { name: 'Midjourney', level: 8, icon: '🖼️', category: 'tech' },
      { name: '美术基础', level: 8, icon: '🎨', category: 'design' },
      { name: '课程制作', level: 6, icon: '📚', category: 'teaching' },
    ],
    milestones: [
      { date: '2023-08', title: '加入公司', description: '负责 AI 绘画课程', icon: '🚀' },
      { date: '2024-03', title: 'AI 绘画课爆款', description: 'Stable Diffusion 课程成为平台最热门课程', icon: '🔥' },
    ],
    blogs: [
      { title: 'AI 绘画工具全景指南', date: '2024-09', summary: '从 SD 到 DALL-E，主流 AI 绘画工具横评...', tags: ['AI绘画', '工具'] },
    ],
    tags: ['AI绘画', 'Stable Diffusion', '美术'],
  },
  {
    id: 25,
    name: '刘鑫磊',
    englishName: 'Ray Liu',
    department: '工程部',
    role: '测试工程师',
    level: '中级',
    avatarSeed: 4007,
    bio: '负责自动化测试和质量保证，确保每次发布都稳定可靠。',
    motto: '质量是生命线',
    joinDate: '2023-06',
    stats: { teaching: 18, research: 42, creativity: 45, influence: 28, teamwork: 88 },
    skills: [
      { name: 'Playwright', level: 8, icon: '🎭', category: 'tech' },
      { name: 'Pytest', level: 7, icon: '🐍', category: 'tech' },
      { name: 'CI/CD', level: 6, icon: '🔄', category: 'tech' },
    ],
    milestones: [
      { date: '2023-06', title: '加入公司', description: '搭建测试体系', icon: '🚀' },
      { date: '2024-02', title: '测试覆盖率 85%', description: '将代码测试覆盖率从 40% 提升到 85%', icon: '📈' },
    ],
    blogs: [],
    tags: ['测试', 'Playwright', '质量保证'],
  },
  {
    id: 26,
    name: '杨佳琪',
    englishName: 'Jackie Yang',
    department: '教学部',
    role: 'AI 编程讲师',
    level: '中级',
    avatarSeed: 3004,
    bio: '擅长 Python 和机器学习教学，课程以实战项目为导向。',
    motto: '写代码是最好的学习方式',
    joinDate: '2023-09',
    stats: { teaching: 85, research: 48, creativity: 68, influence: 55, teamwork: 78 },
    skills: [
      { name: 'Python 教学', level: 8, icon: '🐍', category: 'teaching' },
      { name: 'ML 教学', level: 7, icon: '🤖', category: 'teaching' },
      { name: '项目教学', level: 7, icon: '🎯', category: 'teaching' },
    ],
    milestones: [
      { date: '2023-09', title: '加入公司', description: '第二位编程讲师', icon: '🚀' },
      { date: '2024-07', title: '实战课好评率 96%', description: 'ML 实战课程好评率达到 96%', icon: '⭐' },
    ],
    blogs: [
      { title: '从零实现一个迷你 GPT', date: '2024-08', summary: '用 200 行 Python 带你理解 Transformer...', tags: ['教程', 'GPT'] },
    ],
    tags: ['编程讲师', 'Python', 'ML', '实战'],
  },
  {
    id: 27,
    name: '周诗雅',
    englishName: 'Grace Zhou',
    department: '运营部',
    role: '活动运营',
    level: '初级',
    avatarSeed: 7003,
    bio: '负责线上线下活动策划和执行，包括 AI 黑客松、技术沙龙和学员聚会。',
    motto: '让每次活动都成为记忆',
    joinDate: '2024-02',
    stats: { teaching: 28, research: 15, creativity: 78, influence: 42, teamwork: 88 },
    skills: [
      { name: '活动策划', level: 7, icon: '🎪', category: 'management' },
      { name: '项目管理', level: 5, icon: '📋', category: 'management' },
      { name: '社群运营', level: 6, icon: '👥', category: 'management' },
    ],
    milestones: [
      { date: '2024-02', title: '加入公司', description: '负责活动运营', icon: '🚀' },
      { date: '2024-09', title: '首届 AI 黑客松', description: '成功举办首届 AI 教育黑客松，200 人参与', icon: '🏆' },
    ],
    blogs: [],
    tags: ['活动运营', '黑客松', '社群'],
  },
  {
    id: 28,
    name: '吴嘉欣',
    englishName: 'Cindy Wu',
    department: '设计部',
    role: 'UX 设计师',
    level: '中级',
    avatarSeed: 6003,
    bio: '专注用户体验研究和交互设计，通过用户测试驱动产品改进。',
    motto: '好体验来自对用户的理解',
    joinDate: '2023-10',
    stats: { teaching: 25, research: 48, creativity: 85, influence: 38, teamwork: 82 },
    skills: [
      { name: 'UX 研究', level: 8, icon: '🔍', category: 'design' },
      { name: '交互设计', level: 7, icon: '🖱️', category: 'design' },
      { name: 'Figma', level: 8, icon: '🖌️', category: 'design' },
      { name: '用户测试', level: 7, icon: '🧪', category: 'design' },
    ],
    milestones: [
      { date: '2023-10', title: '加入公司', description: '负责 UX 研究和交互设计', icon: '🚀' },
      { date: '2024-04', title: '学习路径改版', description: '重新设计学习路径页面，转化率提升 30%', icon: '📈' },
    ],
    blogs: [],
    tags: ['UX', '交互设计', '用户研究'],
  },
  {
    id: 29,
    name: '张浩宇',
    englishName: 'Howie Zhang',
    department: '产品部',
    role: '数据产品经理',
    level: '中级',
    avatarSeed: 5003,
    bio: '专注数据产品和 BI 工具建设，为各团队提供数据支撑。',
    motto: '让数据赋能每个决策',
    joinDate: '2023-11',
    stats: { teaching: 30, research: 55, creativity: 60, influence: 40, teamwork: 80 },
    skills: [
      { name: '数据产品', level: 7, icon: '📊', category: 'management' },
      { name: 'SQL', level: 7, icon: '🗃️', category: 'tech' },
      { name: '需求管理', level: 6, icon: '📋', category: 'management' },
    ],
    milestones: [
      { date: '2023-11', title: '加入公司', description: '负责数据产品', icon: '🚀' },
    ],
    blogs: [],
    tags: ['数据产品', 'BI', 'SQL'],
  },
]

export function getEmployees(): readonly EmployeeProfile[] {
  return EMPLOYEES
}

export function getEmployeeById(id: number): EmployeeProfile | undefined {
  return EMPLOYEES.find(e => e.id === id)
}

export function getEmployeesByDepartment(dept: string): readonly EmployeeProfile[] {
  return EMPLOYEES.filter(e => e.department === dept)
}

export function getDepartmentStats(): ReadonlyArray<{ department: string; count: number; avgStats: Stats }> {
  const deptMap = new Map<string, EmployeeProfile[]>()
  for (const emp of EMPLOYEES) {
    const list = deptMap.get(emp.department) ?? []
    list.push(emp)
    deptMap.set(emp.department, list)
  }

  return Array.from(deptMap.entries()).map(([department, members]) => {
    const avg = (key: keyof Stats) =>
      Math.round(members.reduce((sum, m) => sum + m.stats[key], 0) / members.length)
    return {
      department,
      count: members.length,
      avgStats: {
        teaching: avg('teaching'),
        research: avg('research'),
        creativity: avg('creativity'),
        influence: avg('influence'),
        teamwork: avg('teamwork'),
      },
    }
  })
}
