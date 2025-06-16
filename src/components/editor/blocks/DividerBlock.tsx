import React from 'react';
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";

/**
 * 分割线块定义
 * 用于在内容之间插入水平分割线
 */
export const DividerBlock = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {
      // 继承默认属性
      textAlignment: defaultProps.textAlignment,
      backgroundColor: defaultProps.backgroundColor,
      // 自定义属性
      style: {
        default: "solid",
        values: ["solid", "dashed", "dotted"]
      },
      thickness: {
        default: "thin",
        values: ["thin", "medium", "thick"]
      },
      color: {
        default: "gray",
        values: ["gray", "blue", "red", "green", "yellow", "purple"]
      }
    },
    content: "none", // 分割线不包含任何内容
    isSelectable: true, // 可以被选择和删除
  },
  {
    render: (props) => {
      const { block } = props;
      const { style, thickness, color } = block.props;

      // 根据属性生成样式
      const getThickness = () => {
        switch (thickness) {
          case "thin": return "1px";
          case "thick": return "2px";
          default: return "1px"; // 默认使用最细的线条
        }
      };

      const getColor = () => {
        switch (color) {
          case "blue": return "#3b82f6";
          case "red": return "#ef4444";
          case "green": return "#10b981";
          case "yellow": return "#f59e0b";
          case "purple": return "#8b5cf6";
          default: return "#6b7280"; // 使用更深的灰色确保可见
        }
      };

      const getBorderStyle = () => {
        switch (style) {
          case "dashed": return "dashed";
          case "dotted": return "dotted";
          default: return "solid";
        }
      };

      return (
        <div
          className="bn-divider-container"
          style={{
            width: "100%",
            margin: "16px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <hr
            className="bn-divider"
            style={{
              width: "100%",
              height: "0",
              border: "none",
              borderTop: `${getThickness()} ${getBorderStyle()} ${getColor()}`,
              margin: "0",
              opacity: 0.8,
              display: "block"
            }}
          />
        </div>
      );
    },

    // 导出为HTML时的渲染
    toExternalHTML: (props) => {
      const { block } = props;
      const { style, thickness, color } = block.props;

      const getThickness = () => {
        switch (thickness) {
          case "thin": return "1px";
          case "thick": return "4px";
          default: return "2px";
        }
      };

      const getColor = () => {
        switch (color) {
          case "blue": return "#3b82f6";
          case "red": return "#ef4444";
          case "green": return "#10b981";
          case "yellow": return "#f59e0b";
          case "purple": return "#8b5cf6";
          default: return "#6b7280";
        }
      };

      const getBorderStyle = () => {
        switch (style) {
          case "dashed": return "dashed";
          case "dotted": return "dotted";
          default: return "solid";
        }
      };

      return (
        <div style={{ margin: "16px 0" }}>
          <hr
            style={{
              width: "100%",
              height: "0",
              border: "none",
              borderTop: `${getThickness()} ${getBorderStyle()} ${getColor()}`,
              margin: "0",
              opacity: 1
            }}
          />
        </div>
      );
    },

    // 从HTML解析时的处理
    parse: (element) => {
      if (element.tagName === "HR") {
        // 尝试从样式中解析属性
        const borderTop = element.style.borderTop;
        let style = "solid";
        let thickness = "medium";
        let color = "gray";

        if (borderTop.includes("dashed")) style = "dashed";
        else if (borderTop.includes("dotted")) style = "dotted";

        if (borderTop.includes("1px")) thickness = "thin";
        else if (borderTop.includes("4px")) thickness = "thick";

        if (borderTop.includes("#3b82f6")) color = "blue";
        else if (borderTop.includes("#ef4444")) color = "red";
        else if (borderTop.includes("#10b981")) color = "green";
        else if (borderTop.includes("#f59e0b")) color = "yellow";
        else if (borderTop.includes("#8b5cf6")) color = "purple";

        return { style, thickness, color };
      }
      return undefined;
    }
  }
);
