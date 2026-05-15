<script lang="ts">
  interface Props {
    data: {
      urls?: string[]
      mode?: "single" | "grid" | "carousel"
      radius?: number
      width?: "full" | "3/4" | "1/2" | "1/4"
      align?: "left" | "center" | "right"
    }
  }

  let { data }: Props = $props()

  const urls = $derived(data.urls ?? [])
  const mode = $derived(data.mode ?? (urls.length > 1 ? "grid" : "single"))

  const widthMap = { "full": "100%", "3/4": "75%", "1/2": "50%", "1/4": "25%" }
  const w = $derived(widthMap[data.width ?? "full"])
  const align = $derived(data.align ?? "center")
  const justifyMap = { left: "flex-start", center: "center", right: "flex-end" }

  let activeIndex = $state(0)

  function next() { activeIndex = (activeIndex + 1) % urls.length }
  function prev() { activeIndex = (activeIndex - 1 + urls.length) % urls.length }
</script>

<div class="image-block" style="display:flex; justify-content:{justifyMap[align]}">
  <div style="width:{w}; --radius: {data.radius ?? 0}px">
    {#if urls.length === 0}
      <div class="placeholder">🖼 尚未上傳圖片</div>
    {:else if mode === "single" || (mode === "carousel" && urls.length === 1)}
      <img src={urls[0]} alt="img" class="single-img" />
    {:else if mode === "grid"}
      <div class="grid" style="--cols: {urls.length === 2 ? 2 : 3}">
        {#each urls as url}
          <img src={url} alt="img" />
        {/each}
      </div>
    {:else if mode === "carousel"}
      <div class="carousel">
        <img src={urls[activeIndex]} alt="img" />
        <button class="nav prev" onclick={prev}>‹</button>
        <button class="nav next" onclick={next}>›</button>
        <div class="dots">
          {#each urls as _, i}
            <div class="dot" class:active={activeIndex === i}></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .image-block {
    padding: 1rem 0;
  }

  img {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: var(--radius);
    display: block;
  }

  .placeholder {
    padding: 60px;
    text-align: center;
    background: #fafafa;
    border-radius: var(--radius);
    border: 1.5px dashed #eee;
    color: #ccc;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 8px;
  }

  .carousel {
    position: relative;
    aspect-ratio: 16/9;
  }

  .carousel img {
    height: 100%;
  }

  .nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(4px);
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
  }

  .prev { left: 12px; }
  .next { right: 12px; }

  .dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.4);
  }

  .dot.active {
    width: 16px;
    background: white;
  }
</style>
