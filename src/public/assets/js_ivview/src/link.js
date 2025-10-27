const linkTypes = [
  'bookmark',
  'rectangle',
  'page'
]

const linkProperties = [
  'type',
  'pid',
  'pageNumber',
  'name',
  'id',
  'left',
  'top',
  'right',
  'bottom'
]

const uiProperties = [
  'binderView',
  'layout'
]

const searchStringToObject = (searchStr, properties) => {
  const pairs = searchStr.substring(1).split("&")

  if (pairs.length !== 0) {
    const obj = {}
    let pair
    let  i
  
  
    for ( i in pairs ) {
      if ( pairs[i] === "" ) continue;
  
      pair = pairs[i].split("=");
      const propName = decodeURIComponent(pair[0])
      if (properties.includes(propName)) {
        obj[propName] = decodeURIComponent(pair[1]);
      }
    }
  
    return obj;
  }

  return undefined
}

export const viewerLinkFromSearchString = searchStr => {
  const searchObj = searchStringToObject(searchStr, linkProperties)

  if (searchObj && searchObj.type && linkTypes.includes(searchObj.type)) {
    return searchObj
  }

  return undefined
}

export const uiOptionsFromSearchString = searchStr => {
  return searchStringToObject(searchStr, uiProperties)
}
