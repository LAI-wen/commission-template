<script lang="ts">
  import type { ProfileLayout } from "$lib/types/editor"
  import { t } from "$lib/editor-utils"

  interface Props {
    creator: any
    data: {
      layout?: ProfileLayout
      avatarShape?: "circle" | "square"
      coverUrl?: string
      useSlideshow?: boolean
    }
    works?: any[]
    isOpen?: boolean
    styles?: string[]
    accentColor?: string
    heroSlide?: number
    lang?: "zh" | "en"
  }

  let {
    creator,
    data,
    works = [],
    isOpen = false,
    styles = [],
    accentColor = "#000",
    heroSlide = 0,
    lang = "zh"
  }: Props = $props()

  const layout = $derived(data.layout ?? "center")
  const avatarShape = $derived(data.avatarShape ?? "circle")
  const bgImgs = $derived(data.useSlideshow && works.length > 0 ? works.map(w => w.preview_url) : data.coverUrl ? [data.coverUrl] : [])
  const bgImg = $derived(bgImgs[heroSlide % bgImgs.length] ?? "")
</script>

<div class="profile-block profile--{layout}" style="--accent: {accentColor}">
  
  {#if layout === "center"}
    <div class="avatar-wrap">
      {#if creator?.avatar_url}
        <img src={creator.avatar_url} alt="avatar" class="avatar {avatarShape}" />
      {:else}
        <div class="avatar placeholder {avatarShape}">{t(creator?.display_name, lang)?.[0] ?? "?"}</div>
      {/if}
    </div>
    <h1 class="name">{t(creator?.display_name, lang)}</h1>
    {#if creator?.bio}<p class="bio">{t(creator.bio, lang)}</p>{/if}
    {#if styles.length > 0}
      <div class="tags">
        {#each styles as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}
    <div class="status" class:open={isOpen}>
      {isOpen ? (lang === 'en' ? '● Open for Commission' : '● 開放委託中') : (lang === 'en' ? '○ Closed' : '○ 暫停委託')}
    </div>
    {#if creator?.open_note}<p class="note">{t(creator.open_note, lang)}</p>{/if}

  {:else if layout === "side"}
    <div class="side-layout">
      {#if creator?.avatar_url}
        <img src={creator.avatar_url} alt="avatar" class="avatar avatar--lg {avatarShape}" />
      {/if}
      <div class="side-info">
        <h1 class="name name--left">{t(creator?.display_name, lang)}</h1>
        {#if creator?.bio}<p class="bio bio--left">{t(creator.bio, lang)}</p>{/if}
        {#if styles.length > 0}
          <div class="tags">
            {#each styles as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="status" class:open={isOpen}>
           {isOpen ? (lang === 'en' ? '● Open for Commission' : '● 開放委託中') : (lang === 'en' ? '○ Closed' : '○ 暫停委託')}
        </div>
      </div>
    </div>

  {:else if layout === "banner"}
    <div class="banner-area full-bleed" style="background-image: url('{bgImg}'); background-color: color-mix(in srgb, var(--accent) 15%, transparent)">
      {#if bgImgs.length > 1}
        <div class="dots">
          {#each bgImgs as _, i}
            <div class="dot" class:active={heroSlide % bgImgs.length === i}></div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="banner-content">
      {#if creator?.avatar_url}
        <img src={creator.avatar_url} alt="avatar" class="avatar avatar--banner {avatarShape}" />
      {/if}
      <div class="banner-info">
        <h1 class="name">{t(creator?.display_name, lang)}</h1>
        {#if styles.length > 0}
          <div class="tags">
            {#each styles as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="status" class:open={isOpen}>
           {isOpen ? (lang === 'en' ? '● Open for Commission' : '● 開放委託中') : (lang === 'en' ? '○ Closed' : '○ 暫停委託')}
        </div>
        {#if creator?.bio}<p class="bio bio--left">{t(creator.bio, lang)}</p>{/if}
      </div>
    </div>

  {:else if layout === "card"}
    <div class="card-layout full-bleed" style="background-image: url('{bgImg}'); background-color: var(--accent)">
      <div class="glass-card">
        {#if creator?.avatar_url}
          <img src={creator.avatar_url} alt="avatar" class="avatar avatar--card {avatarShape}" />
        {/if}
        <h1 class="name">{t(creator?.display_name, lang)}</h1>
        <div class="status" class:open={isOpen}>
           {isOpen ? (lang === 'en' ? '● Open for Commission' : '● 開放委託中') : (lang === 'en' ? '○ Closed' : '○ 暫停委託')}
        </div>
        {#if creator?.bio}<p class="bio">{t(creator.bio, lang)}</p>{/if}
        {#if styles.length > 0}
          <div class="tags">
            {#each styles as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>

<style>
  .profile-block { --avatar-size: 88px; padding: 1rem 0; }
  .avatar { width: var(--avatar-size); height: var(--avatar-size); object-fit: cover; background: #f0f0f0; }
  .avatar.circle { border-radius: 50%; }
  .avatar.square { border-radius: 20%; }
  .avatar.placeholder { display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: white; background: color-mix(in srgb, var(--accent) 40%, #ccc); }
  .name { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0.5rem 0 0.25rem; line-height: 1.2; }
  .bio { font-size: 0.95rem; opacity: 0.7; line-height: 1.6; white-space: pre-wrap; margin-bottom: 0.75rem; }
  .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .tag { font-size: 0.75rem; padding: 2px 10px; border-radius: 99px; border: 0.5px solid rgba(0,0,0,0.1); color: #666; background: rgba(0,0,0,0.03); }
  .status { display: inline-flex; align-items: center; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 99px; background: #f3f4f6; color: #6b7280; margin-bottom: 0.5rem; }
  .status.open { background: #dcfce7; color: #15803d; }
  .profile--center { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2.5rem 0; }
  .profile--center .tags { justify-content: center; }
  .side-layout { display: flex; align-items: flex-start; gap: 1.5rem; padding: 2rem 0; }
  .avatar--lg { --avatar-size: 110px; }
  .side-info { flex: 1; display: flex; flex-direction: column; align-items: flex-start; }
  .name--left { text-align: left; }
  .bio--left { max-width: 100%; text-align: left; }
  .full-bleed { width: 100vw; margin-left: calc(50% - 50vw); background-size: cover; background-position: center; }
  .banner-area { height: 180px; position: relative; }
  .banner-content { display: flex; align-items: flex-end; gap: 1.25rem; margin-top: -45px; position: relative; z-index: 5; padding: 0 1rem; }
  .avatar--banner { --avatar-size: 100px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .banner-info { flex: 1; padding-bottom: 0.5rem; }
  .dots { position: absolute; bottom: 12px; right: 16px; display: flex; gap: 4px; }
  .dot { width: 6px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.4); }
  .dot.active { width: 16px; background: white; }
  .card-layout { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 3rem 1rem; }
  .glass-card { background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; text-align: center; }
  .avatar--card { --avatar-size: 120px; margin-bottom: 0.5rem; }
</style>
