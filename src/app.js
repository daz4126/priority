import Nanny from "./nanny.js"

// View function
const View = state => {
    // fucntion to add a new item to the main list
    const addTodo = event => {
      event.preventDefault()
      state.Append("list",{id: Date.now().toString(36), text: event.target.task.value, complete: false, snoozed: false, created: Date.now()})
      event.target.task.value = ""
    }
    
    // function to mark an item as complete or uncheck it if it is already complete
    const check = item => event => state.Replace("list",state.list.findIndex(x => x.id === item.id),{...item,complete: item.complete ? false : Date.now()})
    
    // function to snooze a task for a week
     const snooze = (item,days=3) => state.Replace("list",state.list.findIndex(x => x.id === item.id),{...item,snoozed: new Date(Date.now() + 1000 * 60 * 60 * 24 * Number(days)).setHours(0,0,0,0)})
     
     // function to unsnooze a task
     const unsnooze = item => state.Replace("list",state.list.findIndex(x => x.id === item.id),{...item, snoozed: false})
    
    // function that filters all the tasks to show the correct items
    const currentList = () =>  state.mode === "completed" ? [...state.list.filter(item => item.complete),...state.completed]
                      : state.mode === "snoozed" ? state.list.filter(item => item.snoozed && item.snoozed - Date.now() > 0)
                      : state.mode === "priority"  ? state.list.filter(item => !item.complete && (!item.snoozed || item.snoozed - Date.now() < 0)).slice(0,3) 
                      : state.list.filter(item => (!item.complete || Date.now() - item.complete < 1000 * 60 * 60 * 24) && (!item.snoozed || item.snoozed - Date.now() < 0))
    
    // clears completed tasks
    const clearComplete = () => state.Update({
      list: state.list.filter(item => !item.complete),
      completed: [...state.completed, ...state.list.filter(item => item.complete)]
    })
    
    // sorting
    const draggy = {}
    
    const dragstart = event => {
      // line below possibly needed for iOS Safari
      // event.dataTransfer.setData('text/plain', 'hello')
      event.target.classList.add("draggy")
      draggy.item = state.list.find(x => x.id === event.target.id)
      draggy.list = [...state.list.filter(x => x.id !== event.target.id)]
    }
    const dragend = event =>  {
      event.target.classList.remove("draggy")
      if(Number.isInteger(draggy.index)) state.Update({list: [...draggy.list.slice(0,draggy.index+1),draggy.item,...draggy.list.slice(draggy.index+1,draggy.list.length)]})
    }
    
    const dragenter = event => {
      event.target.classList.add("over")
      draggy.index = event.target.classList.contains("list-item") && draggy.list.findIndex(x => x.id === event.target.id)
      const rect = event.target.getBoundingClientRect()
      //console.log(rect.height,rect.top,event.clientY)
      //
    }
    
    const dragleave = event => event.target.classList.remove("over")
    
    
    // ListItem component
    const ListItem = item => 
     state.HTML`<li class="list-item" id="${item.id}" key="${item.id}" draggable=${state.mode === "tasks"} ondragstart=${dragstart} ondragend=${dragend} ondragover=${ e => e.preventDefault() } ondrop=${ e => e.preventDefault() } ondragleave=${dragleave}>
            ${state.mode === "completed" ? "" : 
            state.HTML`<input type="checkbox" 
                              checked=${item.complete} 
                              onchange=${check(item)} />`}
   ${state.mode === "priority" && state.HTML`<span class="exclamation">!</span>`}
                       <span class=${item.complete && state.mode !== "completed" ? "completed-task" : "task"}>${item.text}</span>
                       
                       ${(state.mode === "tasks" || state.mode === "snoozed") && state.HTML`<div class="task-buttons float-end">
   ${state.mode === "snoozed" ?
          state.HTML`<button class="outline" onclick=${e => unsnooze(item)}>UNSNOOZE</button>`
          :
      state.HTML`<select onchange=${e => snooze(item,event.target.value)} class="inline">
                   <option selected disabled>SNOOZE</option>
                   <option value=1>1 Day</option>
                   <option value=2>2 Days</option>
                   <option value=3>3 Days</option>
                   <option value=7>1 Week</option>
                   <option value=36500>Forever</option>
                 </select>`}                                   
                 <button class="inline outline" onclick=${e => state.Update({list: state.list.filter(x => x.id !== item.id)})}>╳</button>   
                      </div>`}    
               ${state.mode === "completed" && item.complete ? state.HTML`<div class="italic lightGrey-text date-info">Completed on ${new Date(item.complete).toLocaleDateString("en-us",{weekday: 'short',month: 'short', day: 'numeric'})}</div>` : ""}
                  </li>`
    
    // main view
    return state.HTML`
    <header>
    <h1 class="text-center" >PR<span class="blue-text">!</span>OR<span class="green-text">!</span>TY<span class="red-text">!</span></h1>
    <div class="buttons row">
    <button class=${`${state.mode === "priority" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "priority"})}>PR!OR!TY!</button>
      <button class=${`${state.mode === "tasks" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "tasks"})}>Task List</button>
      <button class=${`${state.mode === "snoozed" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "snoozed"})}>Snoozed</button>
    </div>
    <form onsubmit=${addTodo} class=${`${state.mode === "tasks" ? "" : "hidden"} align-center`}>
        <input type="text" id="add-task" name="task" placeholder="What do you need to do?"/>
        <button class="blue" id="add-task-button">Add</button>
    </form>
    </header>
    <main>
    ${
      state.mode === "instructions" ?
      state.HTML`<section id="instructions">
    <h1 class="display-3">The ultimate todo list that helps you focus on what's important ...</h1><ul><li>Keep everything you have to do in your task list and order it by priority, with the most important tasks at the top. Drag and drop to to change the list order.</li><li>Snooze any tasks you don't want to think about at the moment or if you're waiting for someone else to do something (don't worry, snoozed tasks will automatically reappear in your task list once they've finished snoozing). Click on the SNOOZED button to see all your snoozed tasks or unsnooze them.</li><li>Click on the PR!OR!TY! button when you need focus on your top 3 tasks. These are the tasks that you are currently working on.</li><li>Completed tasks are automatically removed from the task list a day after completion. You can still see them by clicking on the COMPLETED button.</li><li>Click on the TASK LIST button start adding stuff to do!</li>
    </ul>
    </section>`
    :
    state.mode === "stats" ?
      state.HTML`<section id="stats">
      <p class="italic text-center">There are no stats yet!</p>
       </section>`
    :
     currentList().length ?
     state.HTML`<ul id="todos" class=${`${state.mode === "priority" ? "priority" : ""} no-bullet`} ondragenter=${dragenter}>${currentList().map(item => state.HTML`<${ListItem} ...${item} />`)}</ul>
     <p onclick=${clearComplete} id="clear-button" class=${`${state.mode === "tasks" ? "" : "hidden"} text-center italic lightGrey-text rounded`}>Clear Completed Tasks</p>` 
    : state.HTML`<p id="message" class="text-center"><em>This list is empty!</em></p>`
    }
    <div class="buttons row">
    <button class=${`${state.mode === "completed" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "completed"})}>Completed</button>
    <button class=${`${state.mode === "stats" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "stats"})}>Stats</button>
    <button class=${`${state.mode === "instructions" ? "blue" : "outline"} col`} onclick=${event => state.Update({mode: "instructions"})}>Instructions</button>
    </div>
    </main>
    <footer class="text-center" hidden=${state.mode === "priority"}>
    <p>Another beautifully unconventional <span class="JOG"><span class="J">J</span>O<span class="G">G</span></span> production made with 💚🤍💜 in <a href="https://github.com/daz4126/Nanny-State" title="Nanny State">Nanny State</a></p>
    </footer>`
  }
  
  // Initiate function - always runs at the start
  const Initiate = state => {
    return {
      mode: state.list.length ? "tasks" : "instructions",
      list: state.list.filter(item => (!item.complete || Date.now() - item.complete < 1000 * 60 * 60 * 24)),
      completed: [...state.completed, ...state.list.filter(item => (item.complete && Date.now() - item.complete >= 1000 * 60 * 60 * 24))]
    }
  }
  
  // initial state
  const State = {
    list: [],
    completed: [],
    mode: "tasks",
    Initiate,
    LocalStorageKey: "priority96",
    Debug: true,
    View
  }
  // start the Nanny State!
  Nanny(State)