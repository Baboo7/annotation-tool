<template>
  <div id="host" class="p-2 container-fluid">
    <div class="row p-0 m-0">
      <div id="editor" class="p-1 col-sm-6"
        contenteditable="true"
        @input="updateContent"
        ref="editor"></div>

      <div id="highlighter" class="p-1 col-sm-6" ref="highlighter">
        <div v-for="c in annotatedContent" class="container-hl">
          <span v-if="c.type === 'text'">{{c.text}}</span>
          <span v-if="c.type === 'annotation'"
            class="annotation"
            v-on:mouseover="login(c.annotations)"
            v-on:mouseout="logout(c.annotations)">{{c.text}}</span>
        </div>
      </div>
    </div>

    <div id="actions" class="mt-2">
      <button type="button" class="btn btn-primary">save</button>
      <button class="btn"
        v-bind:class="{ 'btn-light': fadeStopwords, 'btn-secondary': !fadeStopwords }"
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
  export default {
    name: 'landing-page',
    data () {
      return {
        'annotations': [],
        'annotationId': 0,
        'annotatedContent': [],
        'content': '',
        'fadeStopwords': false
      }
    },
    methods: {

      /******************************************/
      /*
      /*    INTERFACE
      /*
      /******************************************/

      login (ids) {
        // console.log('login ' + ids)
      },
      logout (ids) {
        // console.log('logout ' + ids)
      },
      updateContent (ev) {
        this.annotations = this.updateAnnotationsBounds(this.getSelectionCharacterOffsetWithin(this.$refs.editor).start, ev.target.innerText, this.content.length)
        this.content = ev.target.innerText
        this.updateAnnotatedContent()
      },
      updateAnnotatedContent () {
        this.annotatedContent = this.processText(this.content)
      },
      toggleFadeStopwords () {
        this.fadeStopwords = !this.fadeStopwords
      },
      setSelectionBlue () {
        let a = this.getSelectionCharacterOffsetWithin(this.$refs.highlighter)
        if (a.start !== a.end && a.start >= 0 && a.end <= this.content.length) {
          let ann = {
            'id': this.annotationId,
            'start': a.start,
            'end': a.end
          }
          this.annotationId++

          this.annotations.push(ann)
          this.annotations.sort((i, j) => {
            if (i.start < j.start || (i.start === j.start && i.end < j.end)) return -1
            else if (i.start === j.start && i.end < j.end) return 0
            else return 1
          })
          console.log(this.annotations)
          this.updateAnnotatedContent()
        }
      },

      /******************************************/
      /*
      /*    CORE
      /*
      /******************************************/

      /*
        Update annotations bounds while text is edited.

        Args:
          caret: (number) position of the caret in the editor
          newL: (number) new content length
          oldL: (number) old content length

        Return:
          annotations: (array)
      */
      updateAnnotationsBounds (caret, newContent, oldL) {
        let annotations = this.annotations.slice()

        let newL = newContent.length
        if (oldL > newL) {
          // some text has been deleted
          let delta = newL - oldL
          annotations = annotations.map(item => {
            item.start = item.start > caret ? item.start + delta : item.start
            item.end = item.end > caret ? item.end + delta : item.end

            return item
          })
        } else if (oldL < newL) {
          // some text has been added
          let delta = newL - oldL
          annotations = annotations.map(item => {
            item.start = item.start >= caret ? item.start + delta : item.start
            item.end = item.end >= caret ? item.end + delta : item.end

            return item
          })
        }

        annotations = annotations.filter(item => {
          return item.start !== item.end && !/^\s+$/.test(newContent.substring(item.start, item.end))
        })

        return annotations
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
            annotations: (array) conatin ids of the associated annotations
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
    max-width: 800px;

    #editor, #highlighter {
      min-height: 300px;
      background-color: $grey-l;
      border: 1px solid $grey-l;
      word-wrap: break-word;
    }
  }

  .container-hl {
    display: inline;
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
