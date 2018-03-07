<template>
  <div id="annotator" class="pt-2"
    v-bind:class="{ invisible: !show }"
    v-bind:style="{ top: position.top + 'px', left: position.left + 'px' }"
    @mouseover="mouseover"
    @mouseout="mouseout"
    ref="annotator">
    <div class="p-2 container-fluid rounded">
      <strong>Entité<span v-if="entities.length >= 2">s</span></strong><br>
      <div class="row my-1 p-0"
        v-for="e in entities">
        <div class="col-1"></div>
        <div class="col-11">
          <span class="btn btn-text" @click="selectEntity(e)">{{e}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'app-annotator',
  data () {
    return {
      'freshlyUpdated': false,
      'selfHovered': false,
      'position': {
        'top': 0,
        'left': 0
      }
    }
  },
  props: ['mouse'],
  computed: {
    show () {
      return this.freshlyUpdated || this.selfHovered
    },
    ...mapState({
      entities (state) {
        return state.collection.entities
      }
    })
  },
  watch: {
    mouse (newVal, oldVal) {
      this.position = this.computePosition(newVal)
      this.freshlyUpdated = true
    }
  },
  methods: {

    /******************************************/
    /*
    /*    INTERFACE
    /*
    /******************************************/

    mouseover () {
      this.selfHovered = true
      this.freshlyUpdated = false
    },
    mouseout () {
      this.selfHovered = false
    },
    selectEntity (entity) {
      this.$emit('entity-selected', entity)
      this.mouseout()
    },

    /******************************************/
    /*
    /*    CORE
    /*
    /******************************************/

    computePosition (mouse) {
      let thisRect = this.$refs['annotator'].getBoundingClientRect()
      let docRect = document.body.getBoundingClientRect()
      let position = {}
      if (mouse.mouseX + thisRect.width >= docRect.width) position.left = mouse.mouseX - thisRect.width
      else position.left = mouse.mouseX
      position.top = mouse.mouseY

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
    height: 300px;
    position: absolute;
    z-index: 1010;
    > div {
      background-color: yellow;
      border: 1px solid $grey;
    }
  }

  .btn-text {
    &:hover {
      text-decoration: underline;
    }
  }
</style>
