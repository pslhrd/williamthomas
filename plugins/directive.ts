export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("splitChars", {
    mounted(el, binding, vnode, prevNode) {
      console.log(vnode, prevNode)
      const createBoxes = (text, index) => {
        const node = document.createElement('span')
        node.textContent = text
        node.classList.add('split-letter')
        node.style.setProperty('--index', index)
        return node
      }
      
      const splitByLetter = text => [ ...text ].map(createBoxes)
      const letters = splitByLetter(el.textContent)
      el.textContent = null
      el.append(...letters)
    }
  })
})