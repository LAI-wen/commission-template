<script lang="ts">
  import BlockRenderer from "./BlockRenderer.svelte"

  interface Props {
    data: {
      numCols?: number
      widths?: number[]
      cols?: any[][]
    }
    creator?: any
    works?: any[]
    isOpen?: boolean
    styles?: string[]
    accentColor?: string
    types?: any[]
    lang?: "zh" | "en"
  }

  let { data, creator, works = [], isOpen = false, styles = [], accentColor = "#000", types = [], lang = "zh" }: Props = $props()

  const numCols = $derived(data.numCols ?? 2)
  const widths  = $derived(data.widths ?? Array.from({ length: numCols }, () => 100 / numCols))
  const cols    = $derived(data.cols ?? Array.from({ length: numCols }, () => []))
  const gridTemplate = $derived(widths.map(w => `${w}fr`).join(' '))
</script>

<div class="columns-block" style="grid-template-columns: {gridTemplate}">
  {#each cols as colBlocks}
    <div class="column">
      {#each colBlocks as block}
        <BlockRenderer
          {block} {creator} {works} {isOpen} {styles} {accentColor} {types} {lang}
        />
      {/each}
    </div>
  {/each}
</div>

<style>
  .columns-block {
    display: grid;
    gap: 1rem;
    align-items: start;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  @media (max-width: 640px) {
    .columns-block { grid-template-columns: 1fr !important; }
  }
</style>
