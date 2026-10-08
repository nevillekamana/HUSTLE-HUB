const fs = require('fs')
const path = require('path')

function loadCollection(file){
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function validateScriptArray(arr, location){
  if(!Array.isArray(arr)) return
  const code = arr.join('\n')
  try{
    new Function(code)
  }catch(e){
    throw new Error(`${location} contains invalid JS: ${e.message}`)
  }
}

function walk(item, prefix){
  if(item.event){
    item.event.forEach(ev=>{
      if(ev && ev.script && ev.script.exec) validateScriptArray(ev.script.exec, `${prefix} event`)
    })
  }
  if(item.item) item.item.forEach(child=> walk(child, prefix + '/' + (child.name||'unnamed')))
}

function main(){
  const col = loadCollection(process.argv[2] || path.join(__dirname,'..','postman','HustleHub.part2.postman_collection.json'))
  walk(col, col.info && col.info.name ? col.info.name : 'collection')
  console.log('Collection scripts validated (no syntax errors)')
}

main()
