<template>
  <div id="annotation-editor" class="pt-2"
    v-bind:class="{ invisible: !show }"
    v-bind:style="{ top: position.top + 'px', left: position.left + 'px' }"
    v-on:mouseover="selfHovered = true"
    v-on:mouseout="selfHovered = false"
    ref="annotation-editor">
    <div class="p-2 container-fluid rounded">
      <strong>Annotation<span v-if="annotations.length >= 2">s</span></strong><br>
      <div class="row my-1"
        v-for="a in annotations">
        <div class="col-1"></div>
        <div class="col-11">
          <span class="btn btn-text" @click="deleteAnnotation(a.id)">x</span>
          {{a.entity}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'app-annotation-editor',
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
  props: ['hoveredElementPosition', 'annotationsId'],
  computed: {
    show () {
      return this.elementHovered || this.selfHovered
    },
    ...mapState({
      annotations (state) {
        return state.document.annotations.filter(item => this.annotationsId.includes(item.id))
      }
    })
  },
  watch: {
    hoveredElementPosition (newVal, oldVal) {
      if (newVal !== null) {
        this.position = this.computePosition(newVal)
        this.elementHovered = true
      } else {
        this.elementHovered = false
      }
    },
    annotationsId (newVal, oldVal) {
      if (newVal.length === 0) {
        this.annotationsId = oldVal
      }
    }
  },
  methods: {

    /******************************************/
    /*
    /*    INTERFACE
    /*
    /******************************************/

    deleteAnnotation (id) {
      this.$store.commit('DELETE_ANNOTATION', { 'id': id })
      this.$emit('update-annotated-content')
    },

    /******************************************/
    /*
    /*    CORE
    /*
    /******************************************/

    computePosition (tarRect) {
      let annRect = this.$refs['annotation-editor'].getBoundingClientRect()
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

  #annotation-editor {
    width: 300px;
    position: absolute;
    z-index: 1000;
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
