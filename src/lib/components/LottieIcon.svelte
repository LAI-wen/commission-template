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
   *
   * The <dotlottie-player> web component is loaded from CDN in app.html.
   */

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
    hover?: boolean   // play on hover if not autoplay
    speed?: number
    style?: string
  } = $props()

  /* trigger animation on mouse enter when hover=true */
  let playerEl = $state<any>(null)

  function onEnter() {
    if (hover && !loop && playerEl) playerEl.play()
  }
  function onLeave() {
    if (hover && !loop && playerEl) playerEl.stop()
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="lottie-wrap"
  style="width:{size}px;height:{size}px;{style}"
  onmouseenter={onEnter}
  onmouseleave={onLeave}
>
  <!-- @ts-ignore web component -->
  <dotlottie-player
    bind:this={playerEl}
    {src}
    background="transparent"
    speed={speed}
    loop={loop}
    autoplay={autoplay}
    style="width:{size}px;height:{size}px"
  ></dotlottie-player>
</span>

<style>
.lottie-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
