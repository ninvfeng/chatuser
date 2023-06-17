export const getDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1 // 月份从0开始，需要加1
  const day = today.getDate()
  return `${year}-${month}-${day}`
}

export const getParam = (paramName) => {
  const queryString = window.location.search.slice(1)

  if (queryString) {
    const paramPairs = queryString.split('&')

    for (let i = 0; i < paramPairs.length; i++) {
      const pair = paramPairs[i].split('=')
      const name = decodeURIComponent(pair[0])
      const value = decodeURIComponent(pair[1] || '')

      if (name === paramName)
        return value
    }
  }
  return null
}
