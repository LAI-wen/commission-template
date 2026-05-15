<script lang="ts">
  import CardEditor from '$lib/components/editor/CardEditor.svelte'
  import { DEFAULT_GLOBAL } from '$lib/components/editor/globalDesign'
  let { data }: { data: any } = $props()

  function parseConfig() {
    try {
      const raw = data.creator?.page_config
      if (!raw) return null
      const p = JSON.parse(raw as string)
      if (Array.isArray(p.blocks)) return p
    } catch {}
    return null
  }
  const initialConfig = parseConfig()
</script>

<CardEditor creator={data.creator} types={data.types ?? []} queueData={data.queueData} {initialConfig} />

<style>
  :global(.dashboard-content) {
    padding: 0 !important;
    max-width: none !important;
  }
</style>
