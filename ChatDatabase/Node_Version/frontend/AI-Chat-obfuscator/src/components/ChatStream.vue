<template>
  <div class="chat-container">
    <div class="messages" ref="messagesContainer">
      <!--
        消息列表：
        - 使用 v-for 渲染 `messages` 数组。
        - 每条消息包含 `role`（'user' 或 'ai'）和 `text`。
      -->
      <div v-for="(m, idx) in messages" :key="idx" :class="['msg', m.role]">
        <div class="bubble">{{ m.text }}</div>
      </div>

      <!--
        流式加载指示器（正在等待 AI 返回时显示）：
        - 当 `isStreaming` 为 true 时显示一个带动画的气泡。
      -->
      <div v-if="isStreaming" class="msg ai typing">
        <div class="bubble">
          <span class="typing-dots"><i></i><i></i><i></i></span>
        </div>
      </div>
    </div>

    <!-- 输入行：用户输入并提交触发 send() -->
    <form @submit.prevent="send" class="input-row">
      <input v-model="inputText" placeholder="输入你的问题，按回车发送" />
      <button type="submit">发送</button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'

// 消息数组：每项 { role: 'user'|'ai', text: string }
const messages = ref([
  { role: 'ai', text: '你好，我是 AI 助手' }
])

// 绑定输入框的文案
const inputText = ref('')

// 是否正在等待流式响应（用于显示 typing 动画）
const isStreaming = ref(false)

// 消息容器的引用，用于自动滚动
const messagesContainer = ref(null)

// 监听 messages 数组变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })

/**
 * 将分片追加到当前 AI 最后一条消息中。
 * 如果最后一条不是 AI 消息，则创建一条新的 AI 消息。
 * @param {string} text - 本次接收到的文本分片
 */
function appendAiChunk(text) {
  const last = messages.value[messages.value.length - 1]
  if (!last || last.role !== 'ai') {
    // 如果当前最后一条不是 ai，则新建一条 ai 消息
    messages.value.push({ role: 'ai', text })
  } else {
    // 否则直接追加到最后一条 ai 消息文本上（实现流式拼接）
    last.text += text
  }
}

/**
 * 发送用户输入：
 * - 将用户消息加入 messages
 * - 准备用于接收流式响应的空 AI 消息并标记 `isStreaming`
 * - 通过 EventSource 连接后端 SSE `/getReqText`，逐条接收 data 事件
 */
function send() {
  const content = inputText.value && inputText.value.trim()
  if (!content) return

  // 推送用户消息到消息列表
  messages.value.push({ role: 'user', text: content })

  // 推入一条空的 AI 消息，后续流式内容会追加到此条
  messages.value.push({ role: 'ai', text: '' })
  isStreaming.value = true
  inputText.value = ''

  // 使用后端 SSE 接口（开发环境下可直接使用完整后端地址或代理）
  const url = `/api/getReqText/?content=${encodeURIComponent(content)}`
  const evt = new EventSource(url)

  // 处理服务器推送的每条数据
  evt.onmessage = (e) => {
    const data = e.data
    if (!data) return
    // 约定服务器发送 [DONE] 表示流结束
    if (data === '[DONE]') {
      isStreaming.value = false
      evt.close()
      return
    }
    // 普通分片，追加到当前 AI 文本
    appendAiChunk(data)
  }

  // 错误处理：关闭流并在 UI 中显示提示
  evt.onerror = (err) => {
    isStreaming.value = false
    appendAiChunk('\n[连接已关闭或发生错误]')
    evt.close()
  }
}
</script>
<style scoped>
.chat-container {
  height: 90vh;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  padding: 12px;
}

.messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.msg {
  display: flex;
}

.msg.user {
  justify-content: flex-end;
}

.msg.ai {
  justify-content: flex-start;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 70%;
}

.msg.user .bubble {
  background: #e6f7ff;
  color: #000
}

.msg.ai .bubble {
  background: #f0f0f0;
  color: #000
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc
}

.input-row button {
  padding: 8px 12px;
  border-radius: 6px;
}

.typing-dots {
  display: inline-block;
  width: 36px;
}

.typing-dots i {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background: #999;
  border-radius: 50%;
  animation: blink 1s infinite ease-in-out;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.2s
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.4s
}

@keyframes blink {
  0% {
    opacity: 0.3;
    transform: translateY(0)
  }

  50% {
    opacity: 1;
    transform: translateY(-4px)
  }

  100% {
    opacity: 0.3;
    transform: translateY(0)
  }
}
</style>
