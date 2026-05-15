<script lang="ts">
  interface Props {
    data: {
      style?: "solid" | "dashed" | "dotted"
      thickness?: number
      color?: string
      spacing?: number
    }
  }

  let { data }: Props = $props()
</script>

<div 
  class="divider-block" 
  style="--spacing: {data.spacing ?? 16}px; --thickness: {data.thickness ?? 1}px; --style: {data.style ?? 'solid'}; --color: {data.color ?? 'var(--color-border-secondary)'}"
>
  <hr class="line" />
</div>

<style>
  .divider-block {
    padding: var(--spacing) 0;
  }
  .line {
    border: none;
    border-top: var(--thickness) var(--style) var(--color);
    margin: 0;
  }
</style>
