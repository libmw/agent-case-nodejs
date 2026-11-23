import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnableLambda,
  RunnableBranch,
  RunnablePassthrough,
} from '@langchain/core/runnables';

const model = new ChatOpenAI({
  modelName: 'qwen-plus',
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'amap-maps-streamableHTTP': {
      url: 'https://mcp.amap.com/mcp?key=' + process.env.AMAP_MAPS_API_KEY,
    },
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        ...(process.env.ALLOWED_PATHS.split(',') || []),
      ],
    },
    'chrome-devtools': {
      command: 'npx',
      args: ['-y', 'chrome-devtools-mcp@latest'],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

const promptTemp = ChatPromptTemplate.fromMessages([new MessagesPlaceholder('messages')]);

const promptChain = promptTemp.pipe(modelWithTools);

const toolCallRunnable = RunnableLambda.from(async ({ response, messages }) => {
  // 执行工具调用
  for (const toolCall of response.tool_calls) {
    try {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      const toolResult = await foundTool.invoke(toolCall.args);

      // 确保 content 是字符串类型
      let contentStr;
      if (typeof toolResult === 'string') {
        contentStr = toolResult;
      } else if (toolResult && toolResult.text) {
        // 如果返回对象有 text 字段，优先使用
        contentStr = toolResult.text;
      }

      messages.push(
        new ToolMessage({
          content: contentStr,
          tool_call_id: toolCall.id,
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }
});

const toolCallBranch = RunnableBranch.from([
  [(input) => input.response?.tool_calls && input.response.tool_calls.length > 0, toolCallRunnable],
  [
    () => true,
    (state) => {
      return {
        ...state,
        done: true,
        finallyContent: response.content,
      };
    },
  ],
]);

const mainChain = RunnableSequence.from([promptChain, toolCallBranch]);

async function runAgentWithTools(query, maxIterations = 30) {
  const state = {
    done: false,
    messages: [new HumanMessage(query)],
  };

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));
    await mainChain.invoke(state);
    if (state.done) {
      console.log(`\n✨ AI 最终回复:\n${state.finallyContent}\n`);
      break;
    }
  }
}

// await runAgentWithTools("北京南站附近的5个酒店，以及去的路线");
// await runAgentWithTools("北京南站附近的5个酒店，以及去的路线，路线规划生成文档保存到 /Users/guang/Desktop 的一个 md 文件");
await runAgentWithTools(
  '北京南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名',
);

// await mcpClient.close();
