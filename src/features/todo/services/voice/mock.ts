/**
 * Mock speech provider for development without a real microphone.
 * Simulates interim + final transcription with a random Chinese todo phrase.
 * Activated via VITE_VOICE_MOCK=true.
 */

const MOCK_PHRASES = [
  '联系后端团队确认接口文档是否已更新并同步给前端同学',
  '在下周一之前完成首页改版的视觉稿并发给产品经理和项目负责人审阅',
  '整理本季度的用户调研报告并提炼出三个核心痛点发给运营团队参考',
  'Review the pull request for the new authentication module and leave detailed comments before end of day',
  'Schedule a sync with the design and engineering leads to finalize the Q3 roadmap priorities',
  '买牛奶和鸡蛋',
  '明天开会记得准备 PPT',
  '给设计师发邮件确认方案',
  '整理项目文档',
  '下午五点前提交代码review',
  '预约周四的健身课',
  '回复客户的产品反馈邮件',
]

export class MockSpeechProvider {
  isAvailable() { return true }

  startLiveRecognition({
    onResult,
    onEnd,
  }: {
    onResult: (text: string, isFinal: boolean) => void
    onEnd: () => void
    onError: (error: string) => void
  }): () => void {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const schedulePhrase = (delay: number) => {
      const phrase = MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)]

      timers.push(setTimeout(() => {
        if (cancelled) return
        onResult(phrase.slice(0, Math.ceil(phrase.length / 2)), false)
      }, delay))

      timers.push(setTimeout(() => {
        if (cancelled) return
        onResult(phrase, false)
      }, delay + 600))

      timers.push(setTimeout(() => {
        if (cancelled) return
        // Fire final result, then pause before next phrase
        onResult(phrase, true)
        schedulePhrase(2000) // next phrase after 2s gap
      }, delay + 1200))
    }

    schedulePhrase(600)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      onEnd()
    }
  }
}
