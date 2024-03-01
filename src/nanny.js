// import render libraries
import { render } from "preact"
import { html } from "htm/preact"
// State management
export default function Nanny(State){
  const _update = (oldObj,newObj) => Object.entries(newObj).forEach(([prop,value]) => oldObj[prop]  = value)
  if (State.LocalStorageKey && localStorage.getItem(State.LocalStorageKey)) State =  {...State,...JSON.parse(localStorage.getItem(State.LocalStorageKey))}
  State.HTML = html;
  State.Append = (list,value) => State.Update({[list]: [ ...State[list], value ]})
  State.Replace = (list,index,value) => State.Update({[list]: [...State[list].slice(0,index),value,...State[list].slice(index+1, State[list].length)]})
  State.Update = (...transformers) => {    
    setState(...transformers);  
    if (State.LocalStorageKey) localStorage.setItem(State.LocalStorageKey,JSON.stringify(State));
    if (State.Debug) console.log(JSON.stringify(State));
    render(State.View(State),State.Element || document.body);
  };
  if (State.Initiate) setState(State.Initiate);
  if (State.Debug) console.log(JSON.stringify(State));
  render(State.View(State),State.Element || document.body);    
  function setState(...transformers){
    State = transformers.reduce((state,transformer) => {
      const {Update,HTML,Append,Insert,Replace,Remove,...newState} = typeof(transformer) === "function" ? transformer(state) : transformer;
      _update(state,newState);
      return state
      },State);
  }  
  return State.Update
}

export { Nanny }