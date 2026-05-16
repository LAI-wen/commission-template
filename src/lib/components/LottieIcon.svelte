<script lang="ts">
  /**
   * LottieIcon — plays a Flaticon animated icon (Lottie JSON).
   *
   * Usage:
   *   <LottieIcon src="/icons/inbox.json" size={20} />
   *
   * How to get icons:
   *   1. Go to https://www.flaticon.com/animated-icons
   *   2. Download the Lottie JSON file (.json) for your chosen icon
   *   3. Place it in /static/icons/   (e.g. /static/icons/inbox.json)
   *   4. Pass the path as `src` prop
   */

  import { onMount, onDestroy } from 'svelte'

  let {
    src,
    size = 24,
    loop = false,
    autoplay = true,
    hover = true,
    speed = 1,
    style = "",
  }: {
    src: string
    size?: number
    loop?: boolean
    autoplay?: boolean
    hover?: boolean
    speed?: number
    style?: string
  } = $props()

  let canvas = $state<HTMLCanvasElement | null>(null)
  let player: any = null

  onMount(async () => {
    if (!canvas) return
    const { DotLottie } = await import('https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm' as any)
    player = new DotLottie({ canvas, src, autoplay, loop, speed })
  })

  onDestroy(() => { player?.destroy() })

  function onEnter() { if (hover && !loop && player) player.play() }
  function onLeave() { if (hover && !loop && player) player.stop() }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="lottie-wrap"
  style="width:{size}px;height:{size}px;{style}"
  onmouseenter={onEnter}
  onmouseleave={onLeave}
>
  <canvas bind:this={canvas} width={size} height={size}></canvas>
</span>

<style>
.lottie-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
