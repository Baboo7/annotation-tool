<template>
  <div id="annotator" class="pt-2"
    v-bind:class="{ invisible: !show }"
    v-bind:style="{ top: position.top + 'px', left: position.left + 'px' }"
    v-on:mouseover="selfHovered = true"
    v-on:mouseout="selfHovered = false"
    ref="annotator">
    <div class="p-2 rounded">
      <strong>Entité(s)</strong>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-annotator',
  data () {
    return {
      'elementHovered': false,
      'selfHovered': false,
      'position': {
        'top': 0,
        'left': 0
      }
    }
  },
  props: ['hoveredElementPosition'],
  computed: {
    show () {
      return this.elementHovered || this.selfHovered
    }
  },
  watch: {
    hoveredElementPosition (newVal, oldVal) {
      if (newVal !== null) {
        this.position = this.computePosition(newVal)
        this.elementHovered = true
      } else {
        this.elementHovered = false
      }
    }
  },
  methods: {
    computePosition (tarRect) {
      let annRect = this.$refs.annotator.getBoundingClientRect()
      let docRect = document.body.getBoundingClientRect()
      let left = tarRect.left + tarRect.width / 2 - annRect.width / 2
      let position = {}
      position.top = tarRect.bottom
      if (left + annRect.width > docRect.width) position.left = docRect.width - annRect.width
      else if (left < 0) position.left = 0
      else position.left = left

      return position
    }
  }
}
</script>

<style lang="scss">
  @import "../styles/colors.scss";

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: $black;
  }

  #annotator {
    width: 300px;
    position: absolute;
    z-index: 1000;
    > div {
      background-color: yellow;
      border: 1px solid $grey;
    }
  }
</style>
