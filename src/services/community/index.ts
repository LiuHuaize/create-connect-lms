
import { Discussion, Comment, Topic } from './types';
import { getDiscussions, createDiscussion } from './discussionService';
import { getComments, addComment } from './commentService';
import { likeDiscussion, hasLikedDiscussion } from './likeService';
import { likeComment, hasLikedComment } from './commentLikeService';

// 导出一个符合原始communityService结构的对象，保证向后兼容性
export const communityService = {
  getDiscussions,
  createDiscussion,
  likeDiscussion,
  hasLikedDiscussion,
  getComments,
  addComment,
  likeComment,
  hasLikedComment
};

// 导出所有类型
export type { Discussion, Comment, Topic };

// 导出所有单独的函数，以便将来可以选择性地导入
export * from './discussionService';
export * from './commentService';
export * from './likeService';
export * from './commentLikeService';
