<template>
  <div id="host" class="p-2">
    <div id="editor" class="p-1"
      ref="editor"
      contenteditable="true"
      @input="updateContent"
      @focusout="updateHTML"
      v-html="html">
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

    <div class="">
      {{ annotations }}
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
        'content': '',
        'html': '',
        'fadeStopwords': false
      }
    },
    methods: {
      processText (text) {
        let html = text
        html = this.annotateText(html)
        html = html.replace(/\n/g, '<br>')
        if (this.fadeStopwords) html = this.processStopwords(html)
        return html
      },
      annotateText (html) {
        this.annotations.forEach(a => {
          let htmlBegin = 0
          let cursor = 0
          let tags = 0
          while (cursor < a.start) {
            if (html[htmlBegin] === '<') tags++
            else if (html[htmlBegin] === '>') tags--
            else if (tags === 0) {
              cursor++
            }
            htmlBegin++
          }

          let htmlEnd = htmlBegin
          while (cursor < a.end) {
            if (html[htmlEnd] === '<') tags++
            else if (html[htmlEnd] === '>') tags--
            else if (tags === 0) {
              cursor++
            }
            htmlEnd++
          }

          let preAnn = html.substring(0, htmlBegin)
          let ann = html.substring(htmlBegin, htmlEnd)
          let postAnn = html.substring(htmlEnd)
          html = this.createAnnotationTag(preAnn, ann, postAnn)
        })
        return html
      },
      createAnnotationTag (preAnn, ann, postAnn) {
        let tag = `<span class="a" @mouseover="stackAnnotation(${ann.id})">${ann}</span>`
        return preAnn + tag + postAnn
      },
      processStopwords (html) {
        html = html.replace(/(^(le)\s|\sle\s|\s(le)$)/g, (p) => {
          return p.replace(/le/g, '<span class="g">le</span>')
        })
        html = html.replace(/(^(petit)\s|\spetit\s|\s(petit)$)/g, (p) => {
          return p.replace(/petit/g, '<span class="g">petit</span>')
        })
        return html
      },
      updateContent (ev) {
        this.content = ev.target.innerText
      },
      updateHTML () {
        this.html = this.processText(this.content)
      },
      toggleFadeStopwords () {
        this.fadeStopwords = !this.fadeStopwords
        this.updateHTML()
      },
      setSelectionBlue () {
        let a = this.getSelectionCharacterOffsetWithin(this.$refs.editor)
        if (a.start !== a.end && a.start >= 0 && a.end <= this.content.length) {
          let ann = {
            'id': this.annotationId,
            'start': a.start,
            'end': a.end
          }
          this.annotationId++

          this.annotations.push(ann)
          this.updateHTML()
        }
      },
      getSelectionCharacterOffsetWithin (element) {
        let start = 0
        let end = 0
        let doc = element.ownerDocument || element.document
        let win = doc.defaultView || doc.parentWindow
        let sel
        if (typeof win.getSelection !== 'undefined') {
          sel = win.getSelection()
          if (sel.rangeCount > 0) {
            let range = win.getSelection().getRangeAt(0)
            let preCaretRange = range.cloneRange()
            preCaretRange.selectNodeContents(element)
            preCaretRange.setEnd(range.startContainer, range.startOffset)
            start = preCaretRange.toString().length
            preCaretRange.setEnd(range.endContainer, range.endOffset)
            end = preCaretRange.toString().length
          }
        } else if ((sel = doc.selection) && sel.type !== 'Control') {
          let textRange = sel.createRange()
          let preCaretTextRange = doc.body.createTextRange()
          preCaretTextRange.moveToElementText(element)
          preCaretTextRange.setEndPoint('EndToStart', textRange)
          start = preCaretTextRange.text.length
          preCaretTextRange.setEndPoint('EndToEnd', textRange)
          end = preCaretTextRange.text.length
        }
        return { 'start': start, 'end': end }
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

    #editor {
      min-height: 300px;
      background-color: $grey-l;
    }
  }

  .a {
    color: red;
  }

  .g {
    color: $grey;
  }
</style>
