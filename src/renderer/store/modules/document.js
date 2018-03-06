const state = {
  'annotations': [],
  'annotationId': 0
}

const mutations = {
  /*
    Add an annotation in the store.

    Args:
      state: (object)
      payload: (object)
        start: (number) start index
        end: (number) end index
        entity: (string)
  */
  ADD_ANNOTATION (state, payload) {
    let annotation = state.annotations.find(item => {
      return item.start === payload.start && item.end === payload.end && item.entity === payload.entity
    })

    if (typeof annotation === 'undefined') {
      payload.id = state.annotationId
      state.annotations.push(payload)
      state.annotationId++
    }
  },

  /*
    Update annotation bounds when text is edited.

    Args:
      state: (object)
      payload: (object)
        caret: (number) position of the caret in the editor
        newContent: (string) new content
        oldL: (number) old content length
  */
  UPDATE_ANNOTATIONS_BOUNDS (state, payload) {
    let newL = payload.newContent.length
    if (payload.oldL > newL) {
      // some text has been deleted
      let delta = newL - payload.oldL
      state.annotations = state.annotations.map(item => {
        item.start = item.start > payload.caret ? item.start + delta : item.start
        item.end = item.end > payload.caret ? item.end + delta : item.end

        return item
      })
    } else if (payload.oldL < newL) {
      // some text has been added
      let delta = newL - payload.oldL
      state.annotations = state.annotations.map(item => {
        item.start = item.start >= payload.caret ? item.start + delta : item.start
        item.end = item.end >= payload.caret ? item.end + delta : item.end

        return item
      })
    }

    state.annotations = state.annotations.filter(item => {
      return item.start !== item.end && !/^\s+$/.test(payload.newContent.substring(item.start, item.end))
    })
  }
}

const actions = {
  // someAsyncTask ({ commit }) {
  //   // do something async
  //   commit('INCREMENT_MAIN_COUNTER')
  // }
}

export default {
  state,
  mutations,
  actions
}
