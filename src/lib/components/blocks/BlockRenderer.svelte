<script lang="ts">
  import type { Block } from "$lib/types/editor"
  import { t } from "$lib/editor-utils"
  
  import ProfileBlock from "./ProfileBlock.svelte"
  import TextBlock from "./TextBlock.svelte"
  import SectionBlock from "./SectionBlock.svelte"
  import DividerBlock from "./DividerBlock.svelte"
  import ButtonBlock from "./ButtonBlock.svelte"
  import SpacerBlock from "./SpacerBlock.svelte"
  import CommissionBlock from "./CommissionBlock.svelte"
  import GalleryBlock from "./GalleryBlock.svelte"
  import SocialBlock from "./SocialBlock.svelte"
  import PricingBlock from "./PricingBlock.svelte"
  import NoticeBlock from "./NoticeBlock.svelte"
  import ReactionsBlock from "./ReactionsBlock.svelte"
  import QueueBlock from "./QueueBlock.svelte"
  import FAQBlock from "./FAQBlock.svelte"
  import CountdownBlock from "./CountdownBlock.svelte"
  import TermsBlock from "./TermsBlock.svelte"
  import ImageBlock from "./ImageBlock.svelte"
  import AnonymousBoxBlock from "./AnonymousBoxBlock.svelte"
  import ColumnsBlock from "./ColumnsBlock.svelte"
  
  // Bento Blocks
  import BentoBio from "./BentoBio.svelte"
  import BentoStatus from "./BentoStatus.svelte"
  import BentoTools from "./BentoTools.svelte"
  import BentoLinks from "./BentoLinks.svelte"
  import BentoResources from "./BentoResources.svelte"

  interface Props {
    block: Block
    creator?: any
    works?: any[]
    isOpen?: boolean
    styles?: string[]
    accentColor?: string
    heroSlide?: number
    types?: any[]
    lang?: "zh" | "en"
  }

  let { 
    block, 
    creator, 
    works = [], 
    isOpen = false, 
    styles = [], 
    accentColor = "#000",
    heroSlide = 0,
    types = [],
    lang = "zh"
  }: Props = $props()
</script>

{#if block.type === "profile"}
  <ProfileBlock {creator} data={block.data} {works} {isOpen} {styles} {accentColor} {heroSlide} />
{:else if block.type === "BIO"}
  <BentoBio title={t(block.data.title, lang)} content={t(creator?.bio, lang)} tags={styles} {accentColor} />
{:else if block.type === "STATUS"}
  <BentoStatus 
    title={t(block.data.title, lang)} 
    status={isOpen ? "OPEN" : "CLOSED"} 
    statusMessage={t(creator?.open_note, lang)} 
    queueCount={block.data.queueCount ?? 0}
    {accentColor} 
  />
{:else if block.type === "TOOLS"}
  <BentoTools 
    title={t(block.data.title, lang)} 
    tools={(block.data.tools || []).map((tool: any) => ({
      ...tool,
      name: t(tool.name, lang),
      category: t(tool.category, lang),
      description: t(tool.description, lang)
    }))} 
    {accentColor} 
  />
{:else if block.type === "LINKS"}
  <BentoLinks 
    title={t(block.data.title, lang)} 
    links={(block.data.links || []).map((link: any) => ({
      ...link,
      label: t(link.label, lang)
    }))} 
    {accentColor} 
  />
{:else if block.type === "RESOURCES"}
  <BentoResources 
    title={t(block.data.title, lang)} 
    resources={(block.data.resources || []).map((res: any) => ({
      ...res,
      name: t(res.name, lang),
      type: t(res.type, lang)
    }))} 
    {accentColor} 
  />
{:else if block.type === "text"}
  <TextBlock data={block.data} {lang} />
{:else if block.type === "section"}
  <SectionBlock data={block.data} {lang} />
{:else if block.type === "divider"}
  <DividerBlock data={block.data} />
{:else if block.type === "button"}
  <ButtonBlock data={block.data} {lang} />
{:else if block.type === "spacer"}
  <SpacerBlock data={block.data} />
{:else if block.type === "commission"}
  <CommissionBlock data={block.data} {types} {isOpen} {accentColor} {lang} />
{:else if block.type === "gallery"}
  <GalleryBlock data={block.data} {works} {accentColor} {lang} />
{:else if block.type === "social"}
  <SocialBlock data={block.data} {accentColor} />
{:else if block.type === "pricing"}
  <PricingBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "notice"}
  <NoticeBlock id={block.id} data={block.data} {accentColor} {lang} />
{:else if block.type === "reactions"}
  <ReactionsBlock data={block.data} {accentColor} />
{:else if block.type === "queue"}
  <QueueBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "faq"}
  <FAQBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "countdown"}
  <CountdownBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "terms"}
  <TermsBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "image"}
  <ImageBlock data={block.data} />
{:else if block.type === "anonymous_box"}
  <AnonymousBoxBlock data={block.data} {accentColor} {lang} />
{:else if block.type === "columns"}
  <ColumnsBlock data={block.data} {creator} {works} {isOpen} {styles} {accentColor} {types} {lang} />
{:else}
  <div class="unsupported">Unsupported Block: {block.type}</div>
{/if}

<style>
  .unsupported {
    padding: 1rem;
    background: #fdf2f2;
    color: #9b1c1c;
    border-radius: 8px;
    font-size: 0.8rem;
    text-align: center;
  }
</style>
