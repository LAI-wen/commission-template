<script lang="ts">
  interface Props {
    data: {
      height?: number
    }
  }

  let { data }: Props = $props()
</script>

<div class="spacer-block" style="height: {data.height ?? 24}px"></div>

<style>
  .spacer-block {
    width: 100%;
  }
</style>
