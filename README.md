# Claude Code Skills Repository

这是一个Claude Code技能仓库，包含多个为Claude Code设计的专用技能。每个技能都是独立的功能模块，可以通过Claude的Skill工具调用。

## 仓库结构

```
skills/
├── figma-design-analyzer/          # Figma设计分析技能
│   ├── SKILL.md                    # 技能定义文档
│   ├── README.md                   # 使用说明
│   ├── package.json                # Node.js依赖配置
│   ├── scripts/                    # 实现代码
│   ├── evals/                      # 评估测试用例
│   ├── references/                 # 开发文档
│   └── .env.example                # 环境变量模板
└── [其他技能...]                   # 更多技能遵循相同结构
```

## 现有技能

### Figma Design Analyzer (`figma-design-analyzer`)

一个用于分析Figma设计文件、提取设计系统、导出截图和验证设计实现一致性的技能。

**主要功能**：
- 🎨 设计系统提取（颜色、字体、间距、组件）
- 📸 截图导出（PNG/JPG，多倍缩放）
- 🔍 比对验证（CSS/代码与设计一致性）
- 📊 文件信息获取（元数据、结构分析）

**快速开始**：
```bash
cd skills/figma-design-analyzer
npm install
cp .env.example .env  # 设置Figma访问令牌
npm test              # 运行测试
node scripts/figma-cli.js --help  # 查看命令行帮助
```

详细使用说明请查看 [skills/figma-design-analyzer/README.md](skills/figma-design-analyzer/README.md)。

## 使用技能

在Claude对话中，可以通过以下方式使用技能：

1. **直接描述需求**：例如“分析这个Figma文件：https://figma.com/file/abc123”
2. **使用Skill工具**：Claude会自动检测并调用相应技能
3. **命令行调用**：每个技能都提供CLI工具，可直接在终端中使用

## 开发新技能

### 技能结构要求

每个技能目录必须包含以下文件：

- `SKILL.md` - 技能定义文件（包含name、description、compatibility元数据）
- `package.json` - Node.js依赖配置（需指定Node.js 20+）
- `README.md` - 使用说明文档
- `scripts/` - 主要实现代码
- `evals/` - 评估测试用例（`evals.json`）
- `.env.example` - 环境变量模板
- `references/` - 开发文档（可选）

### 创建新技能步骤

1. **创建技能目录**：
   ```bash
   mkdir -p skills/新技能名称
   cd skills/新技能名称
   ```

2. **初始化项目**：
   ```bash
   npm init -y
   # 编辑package.json，添加依赖和scripts
   ```

3. **创建SKILL.md**：
   ```markdown
   ---
   name: 技能名称
   description: 技能描述
   compatibility: 兼容性说明（如需要Node.js 20+）
   ---
   
   # 技能名称
   
   详细使用说明...
   ```

4. **实现功能**：
   - 在`scripts/`目录中编写主要逻辑
   - 添加命令行接口（CLI）
   - 实现错误处理和用户反馈

5. **添加测试**：
   - 创建`evals/evals.json`评估用例
   - 编写单元测试（如需要）
   - 确保技能通过所有测试

6. **编写文档**：
   - `README.md` - 用户文档
   - `references/development.md` - 开发指南（可选）

### 开发规范

- **Node.js版本**：所有技能必须支持Node.js 20+
- **代码质量**：使用ES6+语法，添加JSDoc注释
- **错误处理**：提供清晰的错误消息和恢复建议
- **环境变量**：使用`.env.example`模板，文档说明必需变量
- **测试覆盖**：包含评估用例和单元测试

## 环境要求

- **Node.js 20+**：所有技能基于Node.js运行
- **npm**：包管理工具
- **Git**：版本控制

## 贡献指南

1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送到分支：`git push origin feature/新功能`
5. 创建Pull Request

### 贡献规范

- 遵循现有技能的结构和代码风格
- 为新技能添加完整的文档和测试
- 更新相关文档（如本README）
- 确保所有测试通过

## 许可证

MIT License

## 支持

- 提交Issue：[GitHub Issues](https://github.com/yourusername/agent-skills/issues)
- 技能文档：各技能目录内的README.md和references/
- 开发指南：[CLAUDE.md](CLAUDE.md)（为Claude Code提供开发指导）

## 相关资源

- [Claude Code文档](https://claude.ai/code)
- [技能开发指南](https://docs.claude.ai/code/skills)
- [Figma Design Analyzer技能文档](skills/figma-design-analyzer/README.md)