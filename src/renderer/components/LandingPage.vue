<template>
  <div id="host" class="p-2 container-fluid">
    <app-annotator
      :hovered-element-position="annotator.hoveredAnnotatedElementPosition"
      :annotations-id="annotator.annotationsId"
      v-on:update-annotated-content="updateAnnotatedContent"></app-annotator>

    <div class="row p-0 m-0"
      ref="host-text">
      <transition mode="in-out"
        v-on:before-enter="fadeBefore"
        v-on:enter="fade"
        v-on:before-leave="fadeBefore"
        v-on:leave="fade">
        <div id="editor" class="p-1"
          v-show="isEditing"
          contenteditable="true"
          @input="updateContent"
          ref="editor"></div>
      </transition>

      <div id="highlighter" class="p-1"
        ref="highlighter">
        <span v-for="c in annotatedContent" class="container-hl">
          <span v-if="c.type === 'text'">{{c.text}}</span>
          <span v-if="c.type === 'annotation'" class="annotation"
            v-on:mouseover="login(c.annotations, $event)"
            v-on:mouseout="logout(c.annotations, $event)">{{c.text}}</span>
        </span>
      </div>
    </div>

    <div id="actions" class="mt-2">
      <button type="button" class="btn btn-primary"
        v-bind:class="{
          'btn-light': isEditing,
          'btn-secondary': !isEditing
        }"
        @click="toggleEdition">
        Edit
      </button>

      <button class="btn"
        v-bind:class="{
          'btn-light': fadeStopwords,
          'btn-secondary': !fadeStopwords
        }"
        @click="toggleFadeStopwords">
        stopwords
      </button>

      <button type="button" class="btn btn-info"
        @click="setSelectionBlue">
        blue
      </button>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Velocity from 'velocity-animate'

  export default {
    name: 'landing-page',
    data () {
      return {
        'annotatedContent': [],
        'content': '',
        'fadeStopwords': false,
        'isEditing': false,
        'annotator': {
          'hoveredAnnotatedElementPosition': null,
          'annotationsId': []
        }
      }
    },
    computed: {
      ...mapState({
        annotations (state) {
          return state.document.annotations
        }
      })
    },
    mounted () {
      this.fadeBefore()
    },
    methods: {

      /******************************************/
      /*
      /*    INTERFACE
      /*
      /******************************************/

      login (idx, ev) {
        this.setAnnotatorProps(ev.target.getBoundingClientRect(), idx)
      },
      logout (ids, ev) {
        this.setAnnotatorProps(null)
      },
      updateContent (ev) {
        let payload = {
          'caret': this.getSelectionCharacterOffsetWithin(this.$refs.editor).start,
          'newContent': ev.target.innerText,
          'oldL': this.content.length
        }
        this.$store.commit('UPDATE_ANNOTATIONS_BOUNDS', payload)
        this.content = ev.target.innerText
        this.updateAnnotatedContent()
      },
      updateAnnotatedContent () {
        this.annotatedContent = this.processText(this.content)
        this.setAnnotatorProps(null)
      },
      toggleEdition () {
        this.isEditing = !this.isEditing
      },
      toggleFadeStopwords () {
        this.fadeStopwords = !this.fadeStopwords
      },
      setSelectionBlue () {
        let a = this.getSelectionCharacterOffsetWithin(this.$refs.highlighter)
        if (a.start !== a.end && a.start >= 0 && a.end <= this.content.length) {
          let payload = {
            'start': a.start,
            'end': a.end,
            'entity': 'Fruit'
          }
          this.$store.commit('ADD_ANNOTATION', payload)
          this.updateAnnotatedContent()
        }
      },

      /******************************************/
      /*
      /*    CORE
      /*
      /******************************************/

      setAnnotatorProps (hoveredAnnotatedElementPosition, annotationsId) {
        this.annotator.hoveredAnnotatedElementPosition = hoveredAnnotatedElementPosition
        if (typeof annotationsId !== 'undefined') this.annotator.annotationsId = annotationsId
      },

      /*
        Process a text for highlighting.

        Args:
          text: (string)

        Return:
          chunks: (array) contains objects of the following form
            type: (string) 'text'
            text: (string) text to display
            start: (number) id of the beginning of the chunk
            end: (number) id of the end of the chunk
            ---------------------------------------------------
            type: (string) 'annotation'
            text: (string) text to display
            start: (number) id of the beginning of the chunk
            end: (number) id of the end of the chunk
            annotations: (array) contain ids of the associated annotations
      */
      processText (text) {
        let breakpoints = new Set(this.annotations.map(item => item.start).concat(this.annotations.map(item => item.end)).sort((a, b) => a - b))

        /*
          Creation of chunks conainting
            start: (number) id of the beginning of the chunk
            end: (number) id of the end of the chunk
        */
        let chunks = [{ 'start': 0, 'end': text.length }]
        breakpoints.forEach(bp => {
          let chunkId = chunks.findIndex(item => item.start < bp && bp < item.end)
          if (chunkId !== -1) {
            let chunk = chunks[chunkId]
            let c1 = { 'start': chunk.start, 'end': bp }
            let c2 = { 'start': bp, 'end': chunk.end }
            chunks = chunks.concat([c1, c2])
            chunks.splice(chunkId, 1)
          }
        })

        chunks = chunks.map(item => {
          item.type = 'text'
          item.text = text.substring(item.start, item.end)
          return item
        })

        // Annotation of each chunk
        this.annotations.forEach(annotation => {
          chunks.forEach(chunk => {
            if (annotation.start <= chunk.start && chunk.end <= annotation.end) {
              if (chunk.type !== 'annotation') chunk.type = 'annotation'
              if (typeof chunk.annotations === 'undefined') chunk.annotations = []
              chunk.annotations = [annotation.id].concat(chunk.annotations)
            }
          })
        })

        return chunks
      },

      /*
        Get the bounds of the selection. The positions are relative to the element argument.

        Args:
          element: (object) dom element

        Return:
          (object)
            start: (number) start index of the selection relative to the content
            end: (number) end index of the selection relative to the content
      */
      getSelectionCharacterOffsetWithin (element) {
        let doc = element.ownerDocument || element.document
        let win = doc.defaultView || doc.parentWindow
        let sel

        sel = win.getSelection()
        let start = 0
        let end = 0
        if (sel.rangeCount > 0) {
          let range = sel.getRangeAt(0)
          let preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(element)
          preCaretRange.setEnd(range.startContainer, range.startOffset)
          start = this.convertHighlighterSelectionToContentPosition(preCaretRange.toString())
          preCaretRange.setEnd(range.endContainer, range.endOffset)
          end = this.convertHighlighterSelectionToContentPosition(preCaretRange.toString())
        }

        return { 'start': start, 'end': end }
      },

      /*
        Convert the position of the caret in the selection to the position in the content.

        Args:
          preCaretText: (string) text before the caret

        Return:
          convertedId: (number) id of the caret in the content
      */
      convertHighlighterSelectionToContentPosition (preCaretText) {
        let convertedId = 0
        let selId = 0
        while (selId < preCaretText.length) {
          if (this.content[convertedId] === preCaretText[selId]) convertedId++
          selId++
        }

        return convertedId
      },

      /******************************************/
      /*
      /*    ANIMATION HOOKS
      /*
      /******************************************/

      fadeBefore () {
        let hostTextWidth = this.$refs['host-text'].getBoundingClientRect().width - 10
        if (this.isEditing) {
          this.$refs['editor'].style.opacity = 1
          this.$refs['editor'].style.width = `${hostTextWidth / 2}px`
          this.$refs['editor'].style.whiteSpace = 'normal'
          this.$refs['editor'].style.overflow = 'visible'

          this.$refs['highlighter'].style.width = `${hostTextWidth / 2}px`
        } else {
          this.$refs['editor'].style.opacity = 0
          this.$refs['editor'].style.width = '0px'
          this.$refs['editor'].style.whiteSpace = 'nowrap'
          this.$refs['editor'].style.overflow = 'hidden'

          this.$refs['highlighter'].style.width = `${hostTextWidth}px`
        }
      },
      fade (el, done) {
        let hostTextWidth = this.$refs['host-text'].getBoundingClientRect().width - 10
        if (this.isEditing) {
          Velocity(this.$refs['editor'], { opacity: 1, width: `${hostTextWidth / 2}px` }, { duration: 500, complete: done })
          Velocity(this.$refs['highlighter'], { width: `${hostTextWidth / 2}px` }, { duration: 500 })
        } else {
          Velocity(this.$refs['editor'], { opacity: 0, width: '0px' }, { duration: 500, complete: done })
          Velocity(this.$refs['highlighter'], { width: `${hostTextWidth}px` }, { duration: 500 })
        }
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

  #host {
    margin: 0 auto;
    max-width: 1000px;

    #editor, #highlighter {
      min-height: 300px;
      background-color: $grey-l;
      border: 1px solid $grey;
      word-wrap: break-word;
      text-align: justify;
    }
  }

  .container-hl {
    box-sizing: content-box;
  }

  .annotation {
    background-color: rgba(255,0,0,0.15);

    &:hover {
      background-color: rgba(255,0,0,0.3);
    }
  }

  .g {
    color: $grey;
  }
</style>
