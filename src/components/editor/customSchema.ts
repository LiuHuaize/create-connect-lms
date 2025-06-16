import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { DividerBlock } from "./blocks/DividerBlock";

/**
 * 自定义BlockNote Schema
 * 包含默认块类型和自定义的分割线块
 */
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    // 启用所有默认块类型
    ...defaultBlockSpecs,
    
    // 添加自定义分割线块
    divider: DividerBlock,
  },
});

// 导出类型以便在其他地方使用
export type CustomBlockNoteEditor = typeof customSchema.BlockNoteEditor;
export type CustomBlock = typeof customSchema.Block;
export type CustomPartialBlock = typeof customSchema.PartialBlock;
