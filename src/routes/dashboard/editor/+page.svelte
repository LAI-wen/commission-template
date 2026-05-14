<script lang="ts">
  import CardEditor from '$lib/components/editor/CardEditor.svelte'
  let { data }: { data: any } = $props()
</script>

<CardEditor creator={data.creator} types={data.types ?? []} />

<style>
  :global(.dashboard-content) {
    padding: 0 !important;
    max-width: none !important;
  }
</style>
