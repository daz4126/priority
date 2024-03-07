import Nanny from "./nanny.js"

// View function
const View = state => {
    // fucntion to add a new item to the main list
    const addTodo = event => {
      event.preventDefault()
      state.Append("list",{id: Date.now().toString(36), text: event.target.task.value, complete: false, snoozed: false, created: Date.now(), category: "Work"})
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
                      : state.list.filter(item => ((state.complete && item.complete) || (state.active && !item.complete)) && (!item.category || state.categories.find(category => category[0] === item.category)[1]) && (!item.snoozed || item.snoozed - Date.now() < 0))
    
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

    const toggleCategory = index => event => {
      const category = state.categories[index]
      state.Replace("categories",index,[category[0],!category[1]])
    }
    
    
    // ListItem component
    const ListItem = ({item,position}) => 
     state.HTML`<li class="list-item" id="${item.id}" key="${item.id}" draggable=${state.mode === "tasks"} ondragstart=${dragstart} ondragend=${dragend} ondragover=${ e => e.preventDefault() } ondrop=${ e => e.preventDefault() } ondragleave=${dragleave}>
     ${state.mode === "tasks" && state.HTML`<span class="number">${position}</span>`}
     ${state.mode === "priority" && state.HTML`<span class="exclamation">!</span>`}
    <input type="checkbox" 
           checked=${item.complete} 
           onchange=${check(item)} />
      <span class=${item.complete && state.mode !== "completed" ? "completed-task" : "task"}>${item.text}</span>
      ${(state.mode === "tasks" || state.mode === "snoozed") && state.HTML`
      <div class="task-buttons">
      <button class="inline outline delete-button" onclick=${e => state.Update({list: state.list.filter(x => x.id !== item.id)})}><i class="fa-solid fa-trash"></i></button>   
   ${state.mode === "snoozed" ?
          state.HTML`<button class="outline unsnooze-button" onclick=${e => unsnooze(item)}><i class="fa-solid fa-clock-rotate-left"></i></button>`
          :
      state.HTML`<select onchange=${e => snooze(item,e.target.value)} class="inline">
                   <option selected disabled>snooze</option>
                   <option value=1>1 Day</option>
                   <option value=2>2 Days</option>
                   <option value=3>3 Days</option>
                   <option value=7>1 Week</option>
                   <option value=36500>Forever</option>
                 </select>`}

                 <select onchange=${e => state.Replace("list",state.list.findIndex(x => item.id === x.id),{...item,category: e.target.value})} class="inline">
      ${state.categories.map(category => state.HTML`<option selected=${item.category === category[0]} value=${category[0]}>${category[0]}</option>`)}
      </select>                              
                      </div>
                     <span class="category category${state.categories.findIndex(category => category[0] === item.category)+1} tag">${item.category}</span>
                      `
                    }
      
               ${state.mode === "snoozed" ? state.HTML`<div class="italic lightGrey-text">Snoozed ${item.snoozed - Date.now() > 365 * 24 * 3600000 ? "forever" : item.snoozed - Date.now() < 1000 * 3600 * 24 ? "until tomorrow" : "until " + new Date(item.snoozed).toLocaleDateString("en-us",{weekday: 'long'})}</div>` : ""} 
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
      !state.user ?
      state.HTML`<section id="instructions">
    <h1 class="display-3">The todo list that lets you focus on what's important ...</h1><ul>
    <li>Order your tasks by priority.</li>
    <li>Snooze any tasks you don't want to think about right now.</li>
    <li>Click on the PR!OR!TY! button to focus on your top 3 tasks.</li>
    </ul>
    </section>`
    :
    state.mode === "stats" ?
      state.HTML`<section id="stats">
      <p class="italic text-center">You have completed ${state.completed.length + state.list.filter(item => item.complete).length} task${state.completed.length + state.list.filter(item => item.complete).length === 1 ? "" : "s"}!</p>
       </section>`
    :     
     state.HTML`
     <div id="filters" class=${`${state.mode === "tasks" ? "" : "hidden"} row`}>
     <ul id="filters" class="col-9 row no-bullet">
        <li class=${`${state.active ? "active" : ""} text-center tag`}><button onclick=${e => state.Update({active: !state.active})}>Active</button></li>
        <li class=${`${state.complete ? "active" : ""} text-center tag`}><button onclick=${e => state.Update({complete: !state.complete})}>Completed</button></li>
        ${state.categories.map((category,index) => state.HTML`<li class=${`${category[1] ? "active" : ""} ${"category"+(index+1)} text-center tag`}><button onclick=${toggleCategory(index)}>${category[0]}</button></li>`)}
     </ul>
     <button onclick=${clearComplete} class=${`${state.list.filter(item => item.complete).length ? "" : "hide"} col italic text-right clear-completed`}>Clear Completed</button>
    </div>
     <ul id="todos" class=${`${state.mode === "priority" ? "priority" : ""} no-bullet`} ondragenter=${dragenter}>${currentList().map((item,index) => state.HTML`<${ListItem} item=${item} position=${index + 1} />`)}</ul>
     <p id="message" class="text-center"><em>${currentList().length ? state.mode === "tasks" ? `${currentList().filter(item => item.complete).length} thing${currentList().filter(item => item.complete).length === 1 ? "" : "s"} smushed so far ...` : "" : `This list is empty!`}</em></p>`
    }
    <button id="stats-button" class=${`${state.mode === "stats" ? "blue" : "outline"}`} onclick=${event => state.Update({mode: "stats"})}>Stats</button>
    </main>
    <footer class="text-center" hidden=${state.mode === "priority"}>
    <p>Another beautifully unconventional <span class="JOG"><span class="J">J</span>O<span class="G">G</span></span> production made with 💚🤍💜</p>
    </footer>`
  }
  
  // initial state
  const State = {
    list: [],
    completed: [],
    user: "OG",
    mode: "tasks",
    active: true,
    complete: true,
    categories: [["Home",true],["Work",true],["Hobbies",true]],
    LocalStorageKey: "priority97",
    Debug: true,
    View
  }
  // start the Nanny State!
  Nanny(State)